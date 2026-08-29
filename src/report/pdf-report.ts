/**
 * Экспорт отчётов журнала похода в PDF.
 *
 * Генерация выполняется через pdfmake: документ строится из данных
 * завершённого похода (patrol) и скачивается браузером как файл.
 * Логика полностью отделена от UI-панели журнала — панель лишь передаёт
 * поход, локаль и функцию перевода.
 */
import {
  formatDuration,
  getLog,
  patrolDuration,
  type Patrol,
  type Shot,
  type ShotOutcome,
  type ShotSnapshotCalc,
} from '../core/tdc-log.js'
import { locText, submarineName } from '../core/tdc-data.js'
import type { CanvasElement, Content, TDocumentDefinitions } from 'pdfmake/interfaces'

/** Карта исхода выстрела → ключ i18n локализации. */
export const OUTCOME_KEY: Record<ShotOutcome, string> = {
  none: 'log.outcomeNone',
  hit_1: 'log.outcomeHit1',
  hit_n: 'log.outcomeHitN',
  miss_front: 'log.outcomeMissFront',
  miss_behind: 'log.outcomeMissBehind',
  hit_other: 'log.outcomeHitOther',
}

/** Подсчёт количества выстрелов по каждому исходу. */
export function countOutcomes(shots: Shot[]): Record<ShotOutcome, number> {
  const counts: Record<ShotOutcome, number> = {
    none: 0,
    hit_1: 0,
    hit_n: 0,
    miss_front: 0,
    miss_behind: 0,
    hit_other: 0,
  }
  for (const s of shots) counts[s.outcome]++
  return counts
}

/** Локальная функция перевода, совместимая с i18n.translate. */
export type TranslateFn = (key: string, params?: Record<string, string | number>) => string

/** Имя PDF-файла отчёта: slug имени похода + дата старта. */
export function reportFileName(patrol: Patrol): string {
  const name = (patrol.label.trim() || 'patrol').replace(/[^a-z0-9_-]+/gi, '-')
  const date = new Date(patrol.startedAt)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `tdc-report-${name}-${y}-${m}-${d}.pdf`
}

/** Локальное форматирование даты по локали. */
function dateStr(ts: number, locale: string): string {
  return new Date(ts).toLocaleString(locale)
}

/** Собирает строки снимка калькулятора для построчного вывода в PDF. */
function shotCellText(
  snap: ShotSnapshotCalc,
  locale: string,
): { title: string; formulas: string; inputs: string; results: string } {
  const title = locText(snap.calcTitle, locale) || snap.calcId
  const formulas = snap.formulas
    .map(f => `${locText(f.label, locale) || f.id}: ${f.expr}`)
    .join('; ')
  const inputs = snap.inputs.map(i => `${i.label}: ${i.value}`).join(', ')
  const results = snap.results
    .map(r => `${r.label}${r.unit ? `, ${r.unit}` : ''}: ${r.value}`)
    .join(', ')
  return { title, formulas, inputs, results }
}

/** Векторный логотип проекта (brеnd-mark), рисуется pdfmake canvas. */
function brandCanvas(): CanvasElement[] {
  const logo = '#3fd9c7'
  return [
    { type: 'rect', x: 0, y: 0, w: 48, h: 48, r: 8, color: '#0b1524' },
    { type: 'ellipse', x: 24, y: 24, r1: 20, r2: 20, lineColor: logo, lineWidth: 1 },
    { type: 'ellipse', x: 24, y: 24, r1: 13, r2: 13, lineColor: logo, lineWidth: 1 },
    { type: 'ellipse', x: 24, y: 24, r1: 6, r2: 6, lineColor: logo, lineWidth: 1 },
    { type: 'ellipse', x: 24, y: 24, r1: 1.6, r2: 1.6, color: logo },
    { type: 'line', x1: 24, y1: 24, x2: 24, y2: 6, lineColor: logo, lineWidth: 1 },
    { type: 'ellipse', x: 24, y: 5, r1: 1.8, r2: 1.8, color: logo },
  ]
}

/** Параграф отчёта, описывающий один выстрел. */
function shotBlock(s: Shot, i: number, t: TranslateFn, locale: string): Content[] {
  const outcomeText = t(OUTCOME_KEY[s.outcome])
  const blocks: Content[] = []
  for (const snap of s.snapshot) {
    const cell = shotCellText(snap, locale)
    blocks.push(
      { text: cell.title, style: 'calcTitle' },
      {
        text: [{ text: `${t('log.reportInputs')}: `, style: 'label' }, cell.inputs || '—'],
        style: 'kv',
      },
      {
        text: [{ text: `${t('log.formulasTitle')}: `, style: 'label' }, cell.formulas || '—'],
        style: 'kv',
      },
      {
        text: [{ text: `${t('log.reportResults')}: `, style: 'label' }, cell.results || '—'],
        style: 'kv',
      },
    )
  }
  return [
    { text: t('log.shotN', { n: String(i + 1) }), style: 'shotTitle' },
    {
      columns: [
        {
          width: 'auto',
          text: [{ text: `${t('log.at')}: `, style: 'label' }, formatDuration(s.elapsedMs)],
        },
        {
          width: 'auto',
          text: [
            { text: `${t('log.outcomeLabel')}: `, style: 'label' },
            { text: outcomeText, bold: true },
          ],
        },
      ],
      columnGap: 24,
      margin: [0, 0, 0, 4],
    },
    ...blocks,
    {
      text: [{ text: `${t('log.notePlaceholder')}: `, style: 'label' }, s.note || '—'],
      style: 'kv',
      margin: [0, 4, 0, 0],
    },
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 770, y2: 0, lineWidth: 0.6, lineColor: '#c8d2dc' }],
      margin: [0, 10, 0, 12],
    },
  ]
}

/**
 * Генерирует PDF-отчёт по завершённому походу и инициирует скачивание.
 * pdfmake и шрифты загружаются лениво — отдельными чанками сборки.
 */
export async function exportPatrolPdf(patrol: Patrol, locale: string, t: TranslateFn) {
  const name = patrol.label.trim() || patrol.id.slice(0, 8)
  const author = getLog().authorNick.trim()
  const counts = countOutcomes(patrol.shots)

  const mod = (await import('pdfmake/build/pdfmake')) as unknown as {
    default: {
      vfs: Record<string, string>
      createPdf: (dd: TDocumentDefinitions) => { download: (filename?: string) => void }
    }
  }
  const fonts = (await import('pdfmake/build/vfs_fonts')) as unknown as {
    default?: { pdfMake?: { vfs: Record<string, string> } }
    pdfMake?: { vfs: Record<string, string> }
  }
  const pdf = mod.default
  const vfs = fonts.pdfMake?.vfs ?? fonts.default?.pdfMake?.vfs
  if (vfs) pdf.vfs = vfs

  const summaryRows = [
    [t('log.reportTotal'), String(patrol.shots.length)],
    [t('log.reportHit1'), String(counts.hit_1)],
    [t('log.reportHitN'), String(counts.hit_n)],
    [t('log.reportMissFront'), String(counts.miss_front)],
    [t('log.reportMissBehind'), String(counts.miss_behind)],
    [t('log.reportHitOther'), String(counts.hit_other)],
    [t('log.reportNone'), String(counts.none)],
  ]

  const doc: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [36, 36, 36, 36],
    content: [
      {
        columns: [
          { width: 48, alignment: 'center', canvas: brandCanvas() },
          {
            width: '*',
            stack: [
              { text: t('log.reportTitle'), style: 'title' },
              { text: `${name} · ${dateStr(patrol.startedAt, locale)}`, style: 'subtitle' },
            ],
          },
        ],
        columnGap: 14,
        margin: [0, 0, 0, 6],
      },
      {
        columns: [
          {
            width: '*',
            text: [
              { text: `${t('log.reportAuthor')}: `, style: 'label' },
              author || '—',
            ],
          },
          {
            width: '*',
            text: [
              { text: `${t('log.reportUboat')}: `, style: 'label' },
              patrol.uboatId ? submarineName(patrol.uboatId, locale) : '—',
            ],
          },
          {
            width: '*',
            text: [
              { text: `${t('log.reportPatrol')}: `, style: 'label' },
              name,
            ],
          },
        ],
        columnGap: 24,
      },
      {
        columns: [
          {
            width: '*',
            text: [
              { text: `${t('log.reportStarted')}: `, style: 'label' },
              dateStr(patrol.startedAt, locale),
            ],
          },
          {
            width: '*',
            text: [
              { text: `${t('log.reportEnded')}: `, style: 'label' },
              patrol.endedAt ? dateStr(patrol.endedAt, locale) : '—',
            ],
          },
          {
            width: '*',
            text: [
              { text: `${t('log.reportDuration')}: `, style: 'label' },
              formatDuration(patrolDuration(patrol)),
            ],
          },
        ],
        columnGap: 24,
        margin: [0, 4, 0, 0],
      },
      { text: t('log.reportSummary'), style: 'h2' },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            ...summaryRows.map(([k, v]) => [
              { text: String(k), style: 'cell' } as const,
              { text: String(v), alignment: 'right' as const, style: 'cell' } as const,
            ]),
          ],
        },
        margin: [0, 0, 0, 14],
      },
      { text: t('log.shotsTitle'), style: 'h2' },
      patrol.shots.length === 0
        ? { text: t('log.reportNoShots'), style: 'muted' }
        : patrol.shots.flatMap((s, i) => shotBlock(s, i, t, locale)),
    ],
    styles: {
      title: { fontSize: 19, bold: true, margin: [0, 0, 0, 4] },
      subtitle: { fontSize: 12.5, color: '#5a6a7a', margin: [0, 0, 0, 14] },
      label: { bold: true },
      h2: { fontSize: 13.5, bold: true, margin: [0, 16, 0, 6] },
      shotTitle: { fontSize: 12.5, bold: true, color: '#1e4f74', margin: [0, 14, 0, 4] },
      calcTitle: { fontSize: 11.5, bold: true, color: '#3a5a76', margin: [0, 6, 0, 2] },
      kv: { fontSize: 10, margin: [0, 0, 0, 2] },
      cell: { fontSize: 10.5 },
      muted: { color: '#5a6a7a' },
    },
    defaultStyle: { fontSize: 11, lineHeight: 1.35 },
  }

  pdf.createPdf(doc).download(reportFileName(patrol))
}
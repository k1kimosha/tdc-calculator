/**
 * Справочные данные и математика TDC.
 * Чистые константы/типы/функции без состояния: классы кораблей, подлодки,
 * сценарии, корабельный каталог, методы идентификации, таблицы скоростей,
 * а также формулы дистанции/скорости/углов и форматы чисел.
 */
import type { Locale } from './i18n.js'

export interface ShipClass {
  id: string
  nameRu: string
  nameEn: string
  length: number
  mastHeight: number
  funnelHeight: number
  draft: number
  speed: number
  deckGun: boolean
}

export const DEFAULT_SHIPS: ShipClass[] = [
  {
    id: 'flavik',
    nameRu: 'Корвет класса «Флавик»',
    nameEn: 'Flower Class Corvette',
    length: 62,
    mastHeight: 20,
    funnelHeight: 12,
    draft: 4,
    speed: 16,
    deckGun: true,
  },
  {
    id: 'bittern',
    nameRu: 'Шлюп класса «Биттерн»',
    nameEn: 'Bittern Class Sloop',
    length: 81,
    mastHeight: 23,
    funnelHeight: 10,
    draft: 3,
    speed: 19,
    deckGun: true,
  },
  {
    id: 'tribal',
    nameRu: 'Эсминец класса «Трайбл»',
    nameEn: 'Tribal Class Destroyer',
    length: 115,
    mastHeight: 32,
    funnelHeight: 14,
    draft: 3,
    speed: 36,
    deckGun: true,
  },
]

export interface Submarine {
  id: string
  name: LocaleText
}

export const SUBMARINES: Submarine[] = [
  { id: 'u96', name: { ru: 'U-96', en: 'U-96' } },
  { id: 'u564', name: { ru: 'U-564', en: 'U-564' } },
  { id: 'u552', name: { ru: 'U-552', en: 'U-552' } },
  { id: 'u307', name: { ru: 'U-307', en: 'U-307' } },
]

export function submarineName(id: string, locale: Locale): string {
  const sub = SUBMARINES.find(s => s.id === id)
  return sub ? sub.name[locale] : id
}

export function shipClassName(ship: ShipClass, locale: Locale): string {
  return locale === 'ru'
    ? ship.nameRu || ship.nameEn
    : ship.nameEn || ship.nameRu
}

export function locText(record: Record<string, string>, locale: Locale): string {
  const own = record[locale]
  if (own) return own
  return locale === 'ru' ? record.en ?? '' : record.ru ?? ''
}

export interface Magnification {
  id: string
  label: Record<Locale, string>
  detail: Record<Locale, string>
  coefficient: number
}

export const MAGNIFICATIONS: Magnification[] = [
  {
    id: 'standard',
    label: { ru: 'Штатная ×1,5', en: 'Standard ×1.5' },
    detail: { ru: 'коэффициент 92,5', en: 'coefficient 92.5' },
    coefficient: 92.5,
  },
  {
    id: 'approach',
    label: { ru: 'С приближением ×6', en: 'Approach ×6' },
    detail: { ru: 'коэффициент 366', en: 'coefficient 366' },
    coefficient: 366,
  },
]

export function distanceMeters(height: number, coefficient: number, rizki: number): number {
  return (height * coefficient) / rizki
}

export function rizkiForDistance(height: number, coefficient: number, distance: number): number {
  return (height * coefficient) / distance
}

export function speedKnots(lengthMeters: number, seconds: number): number {
  return (lengthMeters / seconds) * 1.94
}

export function formatNumber(value: number, maxFrac = 2, locale: Locale = 'ru'): string {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString(locale, { maximumFractionDigits: maxFrac })
}

export const CHEAT_SHEET_RIZKI = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.5, 2, 3, 4, 5, 6, 7, 8]

export type ScenarioRowLabel = Record<Locale, string>

export interface ScenarioRow {
  label: ScenarioRowLabel
  value: string
}

export interface ScenarioMode {
  recommendation: Record<Locale, string>
  detection: Record<Locale, string>
  leftCaption: Record<Locale, string>
  rightCaption: Record<Locale, string>
  rows: ScenarioRow[]
}

export interface Scenario {
  id: string
  title: Record<Locale, string>
  surface: ScenarioMode
  submerged: ScenarioMode
}

export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'day',
    title: { ru: 'День, безоблачно, без тумана', en: 'Day, clear sky, no fog' },
    surface: {
      recommendation: { ru: '6000–6500 м', en: '6000–6500 m' },
      detection: { ru: '5000–5500 м', en: '5000–5500 m' },
      leftCaption: { ru: 'Корабль', en: 'Ship' },
      rightCaption: { ru: 'Риски (по трубе)', en: 'Ticks (funnel)' },
      rows: [
        { label: { ru: 'Флавик', en: 'Flower' }, value: '0,6–0,7' },
        { label: { ru: 'Биттерн', en: 'Bittern' }, value: '0,5–0,6' },
        { label: { ru: 'Трайбл', en: 'Tribal' }, value: '0,7–0,8' },
      ],
    },
    submerged: {
      recommendation: { ru: '2500–3000 м', en: '2500–3000 m' },
      detection: { ru: '1800–2200 м', en: '1800–2200 m' },
      leftCaption: { ru: 'Корабль', en: 'Ship' },
      rightCaption: { ru: 'Риски (по трубе)', en: 'Ticks (funnel)' },
      rows: [
        { label: { ru: 'Флавик', en: 'Flower' }, value: '0,3–0,4' },
        { label: { ru: 'Биттерн', en: 'Bittern' }, value: '0,3' },
        { label: { ru: 'Трайбл', en: 'Tribal' }, value: '0,4' },
      ],
    },
  },
  {
    id: 'night',
    title: { ru: 'Ночь, без луны, без тумана', en: 'Night, no moon, no fog' },
    surface: {
      recommendation: { ru: '3000–3500 м', en: '3000–3500 m' },
      detection: { ru: '2000–2500 м', en: '2000–2500 m' },
      leftCaption: { ru: 'Риски (по мачте, Флавик)', en: 'Ticks (mast, Flower)' },
      rightCaption: { ru: 'Дистанция, м', en: 'Range, m' },
      rows: [
        { label: { ru: '2', en: '2' }, value: '3600' },
        { label: { ru: '3', en: '3' }, value: '2400' },
        { label: { ru: '4', en: '4' }, value: '1800' },
        { label: { ru: '5', en: '5' }, value: '1400' },
        { label: { ru: '6', en: '6' }, value: '1200' },
        { label: { ru: '7', en: '7' }, value: '1000' },
      ],
    },
    submerged: {
      recommendation: { ru: '1200–1600 м', en: '1200–1600 m' },
      detection: { ru: '800–1100 м', en: '800–1100 m' },
      leftCaption: { ru: 'Риски (по перископу)', en: 'Ticks (periscope)' },
      rightCaption: { ru: 'Дистанция, м', en: 'Range, m' },
      rows: [
        { label: { ru: '2', en: '2' }, value: '1500' },
        { label: { ru: '3', en: '3' }, value: '1000' },
        { label: { ru: '4', en: '4' }, value: '800' },
        { label: { ru: '5', en: '5' }, value: '600' },
        { label: { ru: '6', en: '6' }, value: '500' },
      ],
    },
  },
]

export interface IdOption {
  en: string
  ru: string
}

export interface IdBlock {
  termEn: string
  termRu: string
  options: IdOption[]
}

export interface IdentificationMethod {
  title: Record<Locale, string>
  blocks?: IdBlock[]
  note?: Record<Locale, string>
}

export const IDENTIFICATION_INTRO: Record<Locale, string> = {
  ru: 'На больших дистанциях, особенно ночью, да ещё в туман, сложно определить, мачта это или кран, где фальшборт, какая надстройка. Единственное, что можно определить уверенно, — расположение трубы.',
  en: 'At long range, especially at night or in fog, it is hard to tell whether it is a mast or a kingpost, where the bulwark is, or what the superstructure looks like. The only thing you can determine with confidence is the funnel position.',
}

export const TORPEDO_SPEEDS: { id: string; label: Record<Locale, string>; knots: number }[] = [
  { id: 't30', label: { ru: '30 уз', en: '30 kn' }, knots: 30 },
  { id: 't40', label: { ru: '40 уз', en: '40 kn' }, knots: 40 },
  { id: 't44', label: { ru: '44 уз', en: '44 kn' }, knots: 44 },
]

export const KNOTS_TO_MS = 0.514_4444

export function torpedoRunSeconds(distance: number, torpedoKnots: number): number {
  return distance / (torpedoKnots * KNOTS_TO_MS)
}

export function okaneLeadDeg(targetKnots: number, torpedoKnots: number): number {
  return (Math.atan(targetKnots / torpedoKnots) * 180) / Math.PI
}

export function leadDeg(targetKnots: number, torpedoKnots: number, aobDegrees: number): number {
  const aob = (aobDegrees * Math.PI) / 180
  const ratio = (targetKnots / torpedoKnots) * Math.sin(aob)
  return (Math.asin(Math.max(-1, Math.min(1, ratio))) * 180) / Math.PI
}

export function trackAngleDeg(aobDegrees: number, leadDegrees: number): number {
  return 180 - aobDegrees - leadDegrees
}

export function visibleMetersFromRizki(rizki: number, distance: number): number {
  return (rizki * distance) / 1000
}

export function aobFromVisibleLength(visible: number, trueLength: number): number {
  const ratio = Math.max(-1, Math.min(1, visible / trueLength))
  return (Math.asin(ratio) * 180) / Math.PI
}

export function visibleLengthFromAob(aobDegrees: number, trueLength: number): number {
  return trueLength * Math.sin((aobDegrees * Math.PI) / 180)
}

export function rizkiFromVisibleMeters(visible: number, distance: number): number {
  return (visible * 1000) / distance
}

export type LocaleText = Record<Locale, string>

export const SPEED_TABLE = [6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36]

export interface CalcControlBase {
  id: string
  label: LocaleText
}

export interface CalcNumberControl extends CalcControlBase {
  kind: 'number'
  name: string
  default: number
  unit?: LocaleText
}

export interface CalcSelectOption {
  id: string
  label: LocaleText
  value: number | string
}

export interface CalcSelectControl extends CalcControlBase {
  kind: 'select'
  name: string
  options: CalcSelectOption[]
  defaultId: string
}

export interface CalcShipsControl extends CalcControlBase {
  kind: 'ships'
  bindLength?: string
  bindMast?: string
  bindFunnel?: string
  landmarkVar?: string
}

export interface CalcLiveTableRow {
  label: LocaleText
  expr: string
}

export interface CalcLiveTableControl extends CalcControlBase {
  kind: 'liveTable'
  rowLabel?: LocaleText
  valueLabel: LocaleText
  rows: CalcLiveTableRow[]
}

export type CalcControl =
  | CalcNumberControl
  | CalcSelectControl
  | CalcShipsControl
  | CalcLiveTableControl

export interface CalcFormula {
  id: string
  expr: string
  label?: LocaleText
  unit?: LocaleText
}

export interface CalculatorConfig {
  id: string
  title: LocaleText
  hint?: LocaleText
  controls: CalcControl[]
  formulas: CalcFormula[]
}

const DEG: LocaleText = { ru: '°', en: '°' }
const METERS: LocaleText = { ru: 'м', en: 'm' }
const KNOTS: LocaleText = { ru: 'уз', en: 'kn' }
const SECONDS: LocaleText = { ru: 'с', en: 's' }

const torpedoOptions: CalcSelectOption[] = TORPEDO_SPEEDS.map(t => ({
  id: t.id,
  label: t.label,
  value: t.knots,
}))

export const DEFAULT_CALC_CONFIGS: CalculatorConfig[] = [
  {
    id: 'distance',
    title: { ru: 'Дистанция', en: 'Range' },
    hint: { ru: 'риски ↔ метры', en: 'ticks ↔ meters' },
    controls: [
      {
        id: 'ship',
        kind: 'ships',
        label: { ru: 'Корабль', en: 'Ship' },
        bindMast: 'h',
        bindFunnel: 'h',
        landmarkVar: 'landmark',
      },
      {
        id: 'landmark',
        kind: 'select',
        label: { ru: 'Ориентир', en: 'Reference' },
        name: 'landmark',
        options: [
          { id: 'mast', label: { ru: 'Мачта', en: 'Mast' }, value: 'mast' },
          { id: 'funnel', label: { ru: 'Труба', en: 'Funnel' }, value: 'funnel' },
        ],
        defaultId: 'mast',
      },
      {
        id: 'k',
        kind: 'select',
        label: { ru: 'Кратность прибора', en: 'Magnification' },
        name: 'k',
        options: [
          { id: 'standard', label: { ru: 'Штатная ×1,5', en: 'Standard ×1.5' }, value: 92.5 },
          { id: 'approach', label: { ru: 'С приближением ×6', en: 'Approach ×6' }, value: 366 },
        ],
        defaultId: 'approach',
      },
      {
        id: 'h',
        kind: 'number',
        label: { ru: 'Высота ориентира, м', en: 'Reference height, m' },
        name: 'h',
        default: 20,
        unit: METERS,
      },
      {
        id: 'r',
        kind: 'number',
        label: { ru: 'Риски по вертикали', en: 'Ticks vertical' },
        name: 'r',
        default: 6,
      },
      {
        id: 'd',
        kind: 'number',
        label: { ru: 'Дистанция, м', en: 'Range, m' },
        name: 'd',
        default: 0,
        unit: METERS,
      },
      {
        id: 'cheat',
        kind: 'liveTable',
        label: { ru: 'Шпаргалка: риски → дистанция', en: 'Cheat sheet: ticks → range' },
        rowLabel: { ru: 'Риски', en: 'Ticks' },
        valueLabel: { ru: 'Дистанция, м', en: 'Range, m' },
        rows: CHEAT_SHEET_RIZKI.map(r => ({
          label: { ru: String(r), en: String(r) },
          expr: `h*k/${r}`,
        })),
      },
    ],
    formulas: [
      { id: 'dist', expr: 'h*k/r', label: { ru: 'Дистанция по рискам', en: 'Range from ticks' }, unit: METERS },
      { id: 'rizki', expr: 'h*k/d', label: { ru: 'Риски по дистанции', en: 'Ticks from range' } },
    ],
  },
  {
    id: 'speed',
    title: { ru: 'Скорость', en: 'Speed' },
    hint: { ru: 'длина ÷ время', en: 'length ÷ time' },
    controls: [
      {
        id: 'ship',
        kind: 'ships',
        label: { ru: 'Корабль', en: 'Ship' },
        bindLength: 'l',
      },
      {
        id: 'l',
        kind: 'number',
        label: { ru: 'Длина цели, м', en: 'Target length, m' },
        name: 'l',
        default: 115,
        unit: METERS,
      },
      {
        id: 't',
        kind: 'number',
        label: { ru: 'Время прохода нос–корма, с', en: 'Bow-to-stern transit time, s' },
        name: 't',
        default: 40,
        unit: SECONDS,
      },
      {
        id: 'cheat',
        kind: 'liveTable',
        label: { ru: 'Шпаргалка: время прохода', en: 'Cheat sheet: transit time' },
        rowLabel: { ru: 'Скорость', en: 'Speed' },
        valueLabel: { ru: 'Время прохода, с', en: 'Transit time, s' },
        rows: SPEED_TABLE.map(v => ({
          label: { ru: `${v} уз`, en: `${v} kn` },
          expr: `l*1.94/${v}`,
        })),
      },
    ],
    formulas: [
      { id: 'speed', expr: 'l/t*1.94', label: { ru: 'Скорость цели', en: 'Target speed' }, unit: KNOTS },
      { id: 'transit', expr: 'l*1.94/speed', label: { ru: 'Время прохода', en: 'Transit time' }, unit: SECONDS },
    ],
  },
  {
    id: 'aob',
    title: { ru: 'КУЦ', en: 'AOB' },
    hint: { ru: 'курсовой угол', en: 'angle on the bow' },
    controls: [
      {
        id: 'ship',
        kind: 'ships',
        label: { ru: 'Корабль', en: 'Ship' },
        bindLength: 'l',
      },
      {
        id: 'l',
        kind: 'number',
        label: { ru: 'Длина цели, м', en: 'Target length, m' },
        name: 'l',
        default: 62,
        unit: METERS,
      },
      {
        id: 'r',
        kind: 'number',
        label: { ru: 'Риски (видимая длина)', en: 'Ticks (visible length)' },
        name: 'r',
        default: 15,
      },
      {
        id: 'd',
        kind: 'number',
        label: { ru: 'Дистанция, м', en: 'Range, m' },
        name: 'd',
        default: 2379,
        unit: METERS,
      },
      {
        id: 'a',
        kind: 'number',
        label: { ru: 'КУЦ, °', en: 'AOB, °' },
        name: 'a',
        default: 90,
        unit: DEG,
      },
      {
        id: 'cheat',
        kind: 'liveTable',
        label: { ru: 'Шпаргалка: КУЦ → риски', en: 'Cheat sheet: AOB → ticks' },
        rowLabel: { ru: 'КУЦ', en: 'AOB' },
        valueLabel: { ru: 'Риски', en: 'Ticks' },
        rows: [15, 30, 45, 60, 75, 90].map(a => ({
          label: { ru: `${a}°`, en: `${a}°` },
          expr: `l*sin(${a}*pi/180)*1000/d`,
        })),
      },
    ],
    formulas: [
      { id: 'visRizki', expr: 'r*d/1000', label: { ru: 'Видимая длина по рискам', en: 'Visible length from ticks' }, unit: METERS },
      { id: 'aob', expr: 'asin(visRizki/l)*180/pi', label: { ru: 'КУЦ по видимой длине', en: 'AOB from visible length' }, unit: DEG },
      { id: 'visAob', expr: 'l*sin(a*pi/180)', label: { ru: 'Видимая длина по КУЦ', en: 'Visible length from AOB' }, unit: METERS },
      { id: 'rizki', expr: 'visRizki*1000/d', label: { ru: 'Риски по видимой длине', en: 'Ticks from visible length' } },
    ],
  },
  {
    id: 'okane',
    title: { ru: 'О’Кейн', en: 'O’Kane' },
    hint: { ru: 'упреждение', en: 'lead angle' },
    controls: [
      {
        id: 'vs',
        kind: 'select',
        label: { ru: 'Скорость торпеды', en: 'Torpedo speed' },
        name: 'vs',
        options: torpedoOptions,
        defaultId: TORPEDO_SPEEDS[1].id,
      },
      {
        id: 'vt',
        kind: 'number',
        label: { ru: 'Скорость цели, уз', en: 'Target speed, kn' },
        name: 'vt',
        default: 8,
        unit: KNOTS,
      },
      {
        id: 'd',
        kind: 'number',
        label: { ru: 'Дистанция, м', en: 'Range, m' },
        name: 'd',
        default: 1500,
        unit: METERS,
      },
      {
        id: 'aob',
        kind: 'number',
        label: { ru: 'КУЦ, °', en: 'AOB, °' },
        name: 'aob',
        default: 90,
        unit: DEG,
      },
    ],
    formulas: [
      { id: 'lead', expr: 'atan(vt/vs)*180/pi', label: { ru: 'Угол упреждения', en: 'Lead angle' }, unit: DEG },
      { id: 'leadGen', expr: 'asin(vt/vs*sin(aob*pi/180))*180/pi', label: { ru: 'Упреждение, общий случай', en: 'Lead, general case' }, unit: DEG },
      { id: 'trackAngle', expr: '180-aob-lead', label: { ru: 'Угол встречи', en: 'Track angle' }, unit: DEG },
      { id: 'runTime', expr: 'd/(vs*c)', label: { ru: 'Время хода торпеды', en: 'Torpedo run time' }, unit: SECONDS },
    ],
  },
]

export function defaultCalcConfig(id: string): CalculatorConfig | undefined {
  return DEFAULT_CALC_CONFIGS.find(c => c.id === id)
}

export function defaultFormulasFor(id: string): CalcFormula[] {
  return DEFAULT_CALC_CONFIGS.find(c => c.id === id)?.formulas ?? []
}

export const IDENTIFICATION_METHODS: IdentificationMethod[] = [
  {
    title: {
      ru: 'Способ №1 — расположение трубы, надстройки, фальшбортов',
      en: 'Method #1 — funnel, superstructure, bulwark position',
    },
    blocks: [
      {
        termEn: 'Engine placement',
        termRu: 'Двигатель',
        options: [
          { en: 'Amidship', ru: 'посередине' },
          { en: 'Aft', ru: 'корма' },
        ],
      },
      {
        termEn: 'Superstructure',
        termRu: 'Надстройка',
        options: [
          { en: 'Split', ru: 'раздельная' },
          { en: 'Composite', ru: 'совмещённая' },
        ],
      },
      {
        termEn: 'Island',
        termRu: 'Фальшборт',
        options: [
          { en: 'Front', ru: 'нос' },
          { en: 'Mid', ru: 'посередине' },
          { en: 'Aft', ru: 'корма' },
        ],
      },
    ],
    note: {
      ru: 'Рекомендую начинать с определения расположения трубы, далее указывать то, в чём вы уверены наверняка. Надстройку тоже видно, но есть конфигурации, когда сложно понять, отдельно она или вместе с трубой. Фальшборты видны хуже всего.',
      en: 'I recommend starting with the funnel position, then marking what you are certain about. The superstructure is also visible, but some configurations make it hard to tell whether it is separate from or merged with the funnel. Bulwarks are the hardest to see.',
    },
  },
  {
    title: {
      ru: 'Способ №2 — расположение мачт, кранов, трубы',
      en: 'Method #2 — masts, kingposts, funnel position',
    },
    blocks: [
      {
        termEn: 'Mast',
        termRu: 'Мачта',
        options: [{ en: 'M', ru: 'мачта' }],
      },
      {
        termEn: 'Funnel',
        termRu: 'Труба',
        options: [{ en: 'F', ru: 'труба' }],
      },
      {
        termEn: 'Kingpost',
        termRu: 'Кран',
        options: [{ en: 'K', ru: 'кран' }],
      },
    ],
    note: {
      ru: 'Проще понять последовательное расположение мачт, кранов и трубы, чем расположение надстройки и фальшбортов.',
      en: 'It is easier to read the sequence of masts, kingposts and funnel than the superstructure and bulwark layout.',
    },
  },
  {
    title: {
      ru: 'Способ №3 — комбинированный',
      en: 'Method #3 — combined',
    },
    note: {
      ru: 'Так как способы №1 и №2 дополняют друг друга, использование их обоих — самый эффективный способ.',
      en: 'Since methods #1 and #2 complement each other, combining both is the most effective approach.',
    },
  },
]
export interface ShipClass {
  id: string
  nameRu: string
  nameEn: string
  length: number
  mastHeight: number
  funnelHeight: number
  draft: number
  speed: number
}

export const WARSHIPS: ShipClass[] = [
  {
    id: 'flavik',
    nameRu: 'Корвет класса «Флавик»',
    nameEn: 'Flower Class Corvette',
    length: 62,
    mastHeight: 20,
    funnelHeight: 12,
    draft: 4,
    speed: 16,
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
  },
]

export interface Magnification {
  id: string
  label: string
  detail: string
  coefficient: number
}

export const MAGNIFICATIONS: Magnification[] = [
  { id: 'standard', label: 'Штатная ×1,5', detail: 'коэффициент 92,5', coefficient: 92.5 },
  { id: 'approach', label: 'С приближением ×6', detail: 'коэффициент 366', coefficient: 366 },
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

export function formatNumber(value: number, maxFrac = 2): string {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('ru-RU', { maximumFractionDigits: maxFrac })
}

export const CHEAT_SHEET_RIZKI = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.5, 2, 3, 4, 5, 6, 7, 8]

export interface ScenarioRow {
  label: string
  value: string
}

export interface Scenario {
  id: string
  title: string
  recommendation: string
  detection: string
  leftCaption: string
  rightCaption: string
  rows: ScenarioRow[]
}

export const SAFE_SCENARIOS: Scenario[] = [
  {
    id: 'day',
    title: 'День, безоблачно, без тумана',
    recommendation: '6000–6500 м',
    detection: '5000–5500 м',
    leftCaption: 'Корабль',
    rightCaption: 'Риски (по трубе)',
    rows: [
      { label: 'Флавик', value: '0,6–0,7' },
      { label: 'Биттерн', value: '0,5–0,6' },
      { label: 'Трайбл', value: '0,7–0,8' },
    ],
  },
  {
    id: 'night',
    title: 'Ночь, без луны, без тумана',
    recommendation: '3000–3500 м',
    detection: '2000–2500 м',
    leftCaption: 'Риски (по мачте, Флавик)',
    rightCaption: 'Дистанция, м',
    rows: [
      { label: '2', value: '3600' },
      { label: '3', value: '2400' },
      { label: '4', value: '1800' },
      { label: '5', value: '1400' },
      { label: '6', value: '1200' },
      { label: '7', value: '1000' },
    ],
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
  title: string
  blocks?: IdBlock[]
  note?: string
}

export const IDENTIFICATION_INTRO =
  'На больших дистанциях, особенно ночью, да ещё в туман, сложно определить, мачта это или кран, где фальшборт, какая надстройка. Единственное, что можно определить уверенно, — расположение трубы.'

export const TORPEDO_SPEEDS: { id: string; label: string; knots: number }[] = [
  { id: 't30', label: '30 уз', knots: 30 },
  { id: 't40', label: '40 уз', knots: 40 },
  { id: 't44', label: '44 уз', knots: 44 },
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

export const IDENTIFICATION_METHODS: IdentificationMethod[] = [
  {
    title: 'Способ №1 — расположение трубы, надстройки, фальшбортов',
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
    note: 'Рекомендую начинать с определения расположения трубы, далее указывать то, в чём вы уверены наверняка. Надстройку тоже видно, но есть конфигурации, когда сложно понять, отдельно она или вместе с трубой. Фальшборты видны хуже всего.',
  },
  {
    title: 'Способ №2 — расположение мачт, кранов, трубы',
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
    note: 'Проще понять последовательное расположение мачт, кранов и трубы, чем расположение надстройки и фальшбортов.',
  },
  {
    title: 'Способ №3 — комбинированный',
    note: 'Так как способы №1 и №2 дополняют друг друга, использование их обоих — самый эффективный способ.',
  },
]
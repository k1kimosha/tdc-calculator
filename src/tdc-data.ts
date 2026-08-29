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

export function shipClassName(ship: ShipClass, locale: Locale): string {
  return locale === 'ru' ? ship.nameRu : ship.nameEn
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

export interface Scenario {
  id: string
  title: Record<Locale, string>
  recommendation: Record<Locale, string>
  detection: Record<Locale, string>
  leftCaption: Record<Locale, string>
  rightCaption: Record<Locale, string>
  rows: ScenarioRow[]
}

export const SAFE_SCENARIOS: Scenario[] = [
  {
    id: 'day',
    title: { ru: 'День, безоблачно, без тумана', en: 'Day, clear sky, no fog' },
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
  {
    id: 'night',
    title: { ru: 'Ночь, без луны, без тумана', en: 'Night, no moon, no fog' },
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
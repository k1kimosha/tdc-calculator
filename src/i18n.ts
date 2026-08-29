import { LitElement } from 'lit'
import { state } from 'lit/decorators.js'

export type Locale = 'ru' | 'en'

const STORAGE_KEY = 'tdc-locale'

let currentLocale: Locale = 'ru'

try {
  const stored = localStorage.getItem(STORAGE_KEY)
  currentLocale = stored === 'en' || stored === 'ru' ? stored : 'ru'
} catch {
  currentLocale = 'ru'
}

document.documentElement.lang = currentLocale

const listeners = new Set<() => void>()

export function getLocale(): Locale {
  return currentLocale
}

export function setLocale(locale: Locale) {
  if (locale === currentLocale) return
  currentLocale = locale
  document.documentElement.lang = locale
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
  listeners.forEach(fn => fn())
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

const ru = {
  app: {
    title: 'TDC калькулятор',
    subtitle: 'Расчёт уставок торпедного компьютера: дистанция и скорость цели',
    tabs: {
      aria: 'Разделы',
      distance: { label: 'Дистанция', hint: 'риски ↔ метры' },
      speed: { label: 'Скорость', hint: 'длина ÷ время' },
      aob: { label: 'КУЦ', hint: 'курсовой угол' },
      okane: { label: 'О’Кейн', hint: 'упреждение' },
      reference: { label: 'Справочник', hint: 'корабли и уставки' },
    },
    lang: {
      label: 'Язык интерфейса',
      ru: 'РУС',
      en: 'ENG',
    },
    footer: {
      left: 'TDC калькулятор · расчёт уставок торпедного компьютера',
      right: 'Дистанция: H × K ÷ риски · Скорость: длина ÷ время × 1,94',
    },
  },
  units: {
    knotsShort: 'уз',
    meterShort: 'м',
    secondShort: 'с',
  },
  distance: {
    title: 'Дистанция до цели',
    ship: {
      label: 'Тип цели',
      manual: 'Ручной ввод',
      manualHint: 'Введите высоту цели вручную',
    },
    point: {
      label: 'Ориентир для замера',
      aria: 'Ориентир',
      mast: 'Мачта',
      funnel: 'Труба',
    },
    height: {
      label: 'Высота цели, м',
      hint: 'По справочнику · можно править',
    },
    mag: {
      label: 'Кратность прицела',
      hint: 'Коэффициент K = {k}',
    },
    mode: {
      label: 'Что рассчитать',
      aria: 'Режим расчёта',
      byTicks: 'Дистанцию по рискам',
      byDistance: 'Риски по дистанции',
    },
    input: {
      byTicks: 'Риски',
      byDistance: 'Введите дистанцию, м',
    },
    result: {
      byTicks: 'Дистанция до цели',
      byDistance: 'Риски (рисок)',
    },
    formula: {
      byTicks: '{h} м × {k} ÷ {r} = {d} м',
      byDistance: '{h} м × {k} ÷ {d} м = {r}',
      emptyTicks: 'Укажите высоту цели и количество рисок',
      emptyDist: 'Укажите высоту цели и дистанцию',
    },
    cheat: {
      title: 'Шпаргалка: риски → дистанция',
      hint: 'Текущая цель и кратность · нажмите на строку, чтобы подставить значение риски',
      colTicks: 'Риски',
      colDistance: 'Дистанция, м',
    },
  },
  speed: {
    title: 'Скорость цели',
    ship: {
      label: 'Тип цели',
      manual: 'Ручной ввод',
      hint: '{en} · длина по справочнику {len} м',
      manualHint: 'Введите длину цели вручную',
    },
    length: {
      label: 'Длина цели, м',
      hint: 'По справочнику · можно править',
    },
    time: {
      label: 'Время прохода нос–корма, с',
      hint: 'За какое время силуэт прошёл от носа до кормы',
    },
    result: {
      caption: 'Скорость цели',
    },
    formula: {
      value: '{l} м ÷ {t} с × 1,94 = {s} уз',
      empty: 'Укажите длину цели и время прохода',
    },
    table: {
      title: 'Быстрый подбор времени',
      hint: 'Время прохода нос–корма для длины цели и нужной скорости (уз)',
      colSpeed: 'Скорость, уз',
      colTime: 'Время, с (для этой длины)',
    },
  },
  aob: {
    title: 'Курсовой угол цели (КУЦ / AOB)',
    ship: {
      label: 'Тип цели',
      manual: 'Ручной ввод',
      hint: '{en} · длина {len} м',
      manualHint: 'Введите длину цели вручную',
    },
    length: {
      label: 'Длина цели, м',
      hint: 'По справочнику · можно править',
    },
    dist: {
      label: 'Дистанция до цели, м',
      hint: 'Например, с вкладки «Дистанция»',
    },
    side: {
      label: 'Борт цели',
      aria: 'Борт',
      port: 'Левый',
      starboard: 'Правый',
    },
    mode: {
      label: 'Рассчитать',
      aria: 'Режим расчёта',
      byVisible: 'КУЦ по видимой длине',
      byAob: 'Риски по КУЦ',
    },
    input: {
      byVisible: 'Видимая длина цели, риски',
      byAob: 'Курсовой угол, °',
    },
    result: {
      byVisible: 'Курсовой угол цели (КУЦ)',
      byAob: 'Видимая длина в рисках',
    },
    formula: {
      byVisible: 'Видимая длина: {r} рис. × {d} м ÷ 1000 = {v} м → КУЦ = arcsin({v} ÷ {l}) = {a}°',
      byAob: 'КУЦ {a}° → длина = {l} м × sin({a}°) = {v} м → {ri} рис. при D = {d} м',
      empty: 'Укажите видимую длину цели и дистанцию',
    },
    kv: {
      byVisible: 'Видимая длина по введённым рискам',
      byAob: 'Видимая длина при этом КУЦ',
    },
    cheat: {
      title: 'Шпаргалка: КУЦ → риски',
      hint: 'Для этой цели и дистанции · нажмите на строку, чтобы подставить КУЦ',
      colAob: 'КУЦ, °',
      colVisible: 'Видимая длина, м',
      colTicks: 'Риски',
    },
  },
  okane: {
    title: 'Метод Дика О’Кейна',
    intro:
      'Лодка стоит перпендикулярно курсу цели. В TDC выставляется КУЦ 90° (П/Л по борту), вводится скорость цели. Ждите, пока цель не подойдёт на упреждение β к траверзу, и стреляйте прямым ходом.',
    vt: {
      label: 'Скорость цели, уз',
      hint: 'Замерьте на вкладке «Скорость»',
    },
    vs: {
      label: 'Скорость торпеды',
      manual: 'Вручную',
      aria: 'Скорость торпеды, уз',
      hint: '{k} уз',
    },
    kv: {
      beta: 'Угол упреждения β = arctan(Vt ÷ Vs)',
      bearing: 'Пеленг на выстрел (от носа)',
      bearingValue: '{b}° в сторону движения цели',
      aobFire: 'КУЦ цели на момент выстрела',
    },
    result: {
      caption: 'Держите упреждение',
      formula: 'β = arctan({vt} ÷ {vs}) = {b}°',
      empty: 'Введите скорости цели и торпеды',
    },
    general: {
      title: 'Общий случай упреждения',
      intro:
        'Если цель не на траверзе: входные данные — текущий КУЦ (AOB) на момент выстрела. Угол встречи (TTA) — угол между курсом цели и ходом торпеды в точке встречи.',
      aobLabel: 'КУЦ цели на момент выстрела, °',
      aobHint: 'Острый (<90°) — идёт навстречу, тупой — отворачивает',
      caption: 'Угол упреждения β = arcsin((Vt ÷ Vs) × sin(КУЦ))',
      formula: 'β = {b}° · угол встречи TTA = 180° − {a}° − {b}° = {tta}°',
      empty: 'Введите КУЦ и скорости',
    },
    run: {
      title: 'Время хода торпеды',
      distLabel: 'Дистанция до цели, м',
      distHint: 'С вкладки «Дистанция»',
      caption: 'Время хода торпеды',
      formula: '{d} м ÷ ({vs} уз × 0,5144) = {t} с',
      empty: 'Введите дистанцию и скорость торпеды',
      sec: 'с',
      min: 'мин',
      approx: '≈',
    },
  },
  reference: {
    ships: {
      title: 'Параметры военных кораблей',
      colClass: 'Класс',
      colLength: 'Длина, м',
      colMastFunnel: 'Мачта / труба, м',
      colDraft: 'Осадка, м',
      colSpeed: 'Скорость, уз',
    },
    scenario: {
      title: 'Безопасные дистанции',
      recommendation: 'Рекомендация',
      detection: 'Обнаружение',
    },
    ident: {
      title: 'Идентификация судов',
    },
  },
}

export type Messages = typeof ru

const en: Messages = {
  app: {
    title: 'TDC Calculator',
    subtitle: 'Torpedo data computer settings: target range and speed',
    tabs: {
      aria: 'Sections',
      distance: { label: 'Range', hint: 'ticks ↔ meters' },
      speed: { label: 'Speed', hint: 'length ÷ time' },
      aob: { label: 'AOB', hint: 'angle on the bow' },
      okane: { label: 'O’Kane', hint: 'lead angle' },
      reference: { label: 'Reference', hint: 'ships & settings' },
    },
    lang: {
      label: 'Interface language',
      ru: 'RU',
      en: 'EN',
    },
    footer: {
      left: 'TDC Calculator · torpedo data computer settings',
      right: 'Range: H × K ÷ ticks &nbsp;·&nbsp; Speed: length ÷ time × 1.94',
    },
  },
  units: {
    knotsShort: 'kn',
    meterShort: 'm',
    secondShort: 's',
  },
  distance: {
    title: 'Range to target',
    ship: {
      label: 'Ship class',
      manual: 'Manual input',
      manualHint: 'Enter the target height manually',
    },
    point: {
      label: 'Reference point',
      aria: 'Reference point',
      mast: 'Mast',
      funnel: 'Funnel',
    },
    height: {
      label: 'Target height, m',
      hint: 'From the reference · editable',
    },
    mag: {
      label: 'Magnification',
      hint: 'Coefficient K = {k}',
    },
    mode: {
      label: 'Calculate',
      aria: 'Calculation mode',
      byTicks: 'Range from ticks',
      byDistance: 'Ticks from range',
    },
    input: {
      byTicks: 'Ticks',
      byDistance: 'Enter the range, m',
    },
    result: {
      byTicks: 'Range to target',
      byDistance: 'Ticks',
    },
    formula: {
      byTicks: '{h} m × {k} ÷ {r} = {d} m',
      byDistance: '{h} m × {k} ÷ {d} m = {r}',
      emptyTicks: 'Enter the target height and ticks count',
      emptyDist: 'Enter the target height and range',
    },
    cheat: {
      title: 'Cheat sheet: ticks → range',
      hint: 'Current ship and magnification · click a row to set the ticks value',
      colTicks: 'Ticks',
      colDistance: 'Range, m',
    },
  },
  speed: {
    title: 'Target speed',
    ship: {
      label: 'Ship class',
      manual: 'Manual input',
      hint: '{en} · reference length {len} m',
      manualHint: 'Enter the target length manually',
    },
    length: {
      label: 'Target length, m',
      hint: 'From the reference · editable',
    },
    time: {
      label: 'Bow-to-stern transit time, s',
      hint: 'How long the silhouette takes to pass bow to stern',
    },
    result: {
      caption: 'Target speed',
    },
    formula: {
      value: '{l} m ÷ {t} s × 1.94 = {s} kn',
      empty: 'Enter the target length and transit time',
    },
    table: {
      title: 'Quick time lookup',
      hint: 'Bow-to-stern transit time for the target length and the desired speed (kn)',
      colSpeed: 'Speed, kn',
      colTime: 'Time, s (for this length)',
    },
  },
  aob: {
    title: 'Angle on the bow (AOB)',
    ship: {
      label: 'Ship class',
      manual: 'Manual input',
      hint: '{en} · length {len} m',
      manualHint: 'Enter the target length manually',
    },
    length: {
      label: 'Target length, m',
      hint: 'From the reference · editable',
    },
    dist: {
      label: 'Range to target, m',
      hint: 'e.g. from the "Range" tab',
    },
    side: {
      label: 'Target side',
      aria: 'Target side',
      port: 'Port',
      starboard: 'Starboard',
    },
    mode: {
      label: 'Calculate',
      aria: 'Calculation mode',
      byVisible: 'AOB from visible length',
      byAob: 'Ticks from AOB',
    },
    input: {
      byVisible: 'Visible target length, ticks',
      byAob: 'Angle on the bow, °',
    },
    result: {
      byVisible: 'Angle on the bow (AOB)',
      byAob: 'Visible length in ticks',
    },
    formula: {
      byVisible: 'Visible length: {r} ticks × {d} m ÷ 1000 = {v} m → AOB = asin({v} ÷ {l}) = {a}°',
      byAob: 'AOB {a}° → length = {l} m × sin({a}°) = {v} m → {ri} ticks at D = {d} m',
      empty: 'Enter the visible target length and range',
    },
    kv: {
      byVisible: 'Visible length from the entered ticks',
      byAob: 'Visible length at this AOB',
    },
    cheat: {
      title: 'Cheat sheet: AOB → ticks',
      hint: 'For this ship and range · click a row to set the AOB',
      colAob: 'AOB, °',
      colVisible: 'Visible length, m',
      colTicks: 'Ticks',
    },
  },
  okane: {
    title: 'Dick O’Kane method',
    intro:
      'The boat sits perpendicular to the target course. Set AOB 90° (port/starboard side) on the TDC and enter the target speed. Wait until the target closes to the lead angle β short of the beam, then fire on a straight course.',
    vt: {
      label: 'Target speed, kn',
      hint: 'Measure on the "Speed" tab',
    },
    vs: {
      label: 'Torpedo speed',
      manual: 'Manual',
      aria: 'Torpedo speed, kn',
      hint: '{k} kn',
    },
    kv: {
      beta: 'Lead angle β = atan(Vt ÷ Vs)',
      bearing: 'Firing bearing (from the bow)',
      bearingValue: '{b}° toward the target',
      aobFire: 'Target AOB at firing moment',
    },
    result: {
      caption: 'Hold the lead',
      formula: 'β = atan({vt} ÷ {vs}) = {b}°',
      empty: 'Enter target and torpedo speeds',
    },
    general: {
      title: 'General lead case',
      intro:
        'If the target is not abeam: the input is the current AOB at the firing moment. The track angle (TTA) is the angle between the target course and the torpedo track at the meeting point.',
      aobLabel: 'Target AOB at firing moment, °',
      aobHint: 'Acute (<90°): target is closing · obtuse: target is turning away',
      caption: 'Lead angle β = asin((Vt ÷ Vs) × sin(AOB))',
      formula: 'β = {b}° · track angle TTA = 180° − {a}° − {b}° = {tta}°',
      empty: 'Enter the AOB and speeds',
    },
    run: {
      title: 'Torpedo run time',
      distLabel: 'Range to target, m',
      distHint: 'From the "Range" tab',
      caption: 'Torpedo run time',
      formula: '{d} m ÷ ({vs} kn × 0.5144) = {t} s',
      empty: 'Enter the range and torpedo speed',
      sec: 's',
      min: 'min',
      approx: '≈',
    },
  },
  reference: {
    ships: {
      title: 'Warship parameters',
      colClass: 'Class',
      colLength: 'Length, m',
      colMastFunnel: 'Mast / funnel, m',
      colDraft: 'Draft, m',
      colSpeed: 'Speed, kn',
    },
    scenario: {
      title: 'Safe distances',
      recommendation: 'Recommended',
      detection: 'Detection limit',
    },
    ident: {
      title: 'Ship identification',
    },
  },
}

export const messages: Record<Locale, Messages> = { ru, en }

function readPath(obj: object, path: string): unknown {
  let node: unknown = obj
  for (const part of path.split('.')) {
    if (node == null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return node
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  let value = readPath(messages[locale] ?? messages.ru, key)
  if (typeof value !== 'string') {
    value = readPath(messages.ru, key)
  }
  if (typeof value !== 'string') return key
  let output = value
  if (params) {
    for (const [name, paramValue] of Object.entries(params)) {
      output = output.replaceAll(`{${name}}`, String(paramValue))
    }
  }
  return output
}

export class I18nElement extends LitElement {
  @state() protected locale: Locale = getLocale()

  private _unsubscribe?: () => void

  connectedCallback() {
    super.connectedCallback()
    this._unsubscribe = subscribe(() => {
      this.locale = getLocale()
    })
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._unsubscribe?.()
    this._unsubscribe = undefined
  }

  protected t(key: string, params?: Record<string, string | number>): string {
    return translate(this.locale, key, params)
  }
}
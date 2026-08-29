import type { Messages } from './ru.js'

export const en: Messages = {
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
# TDC Calculator

[Русский](./README.ru.md)

A web calculator for torpedo data computer (TDC) settings for a submarine simulator.
Computes target range, speed and angle on the bow from periscope ticks ("риски"), the Dick O'Kane method and other useful firing parameters.

## Features

- Interface in Russian and English with a language switch in the header (RU/EN)

**Range**
- Range from target height: `H × K ÷ ticks`
- Magnifications: standard ×1.5 (K = 92.5) and approach ×6 (K = 366)
- Reference point: mast or funnel; pick a ship from the reference or enter manually
- Reverse calculation (ticks from a known range)
- Clickable "ticks → range" cheat sheet

**Speed**
- Target speed: `length ÷ bow-to-stern transit time × 1.94`
- Time-to-transit table for a desired speed

**AOB (Angle on the Bow)**
- AOB from visible length: `AOB = asin(Lvis ÷ Ltrue)`
- Visible length in meters from ticks at known range: `ticks × D ÷ 1000`
- Reverse calculation (ticks from AOB), side selection (port/starboard)
- "AOB → ticks" cheat sheet

**Dick O'Kane method**
- Lead angle: `β = atan(Vt ÷ Vs)`
- Firing bearing and target AOB at firing time (`90° − β`)
- General case lead: `β = asin((Vt ÷ Vs) × sin AOB)` and track angle
- Torpedo run time: `D ÷ (Vs × 0.5144)`

**Reference**
- Warship parameters (Flower, Bittern, Tribal): length, mast/funnel, draft, speed
- Safe ranges day/night (recommendations, detection, ticks)
- Ship identification: three methods (funnel/superstructure/bulwark layout, mast/crane/funnel sequence, combined)

## Tech stack

- [Lit](https://lit.dev/) — web components
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) — build tool and dev server

## Community

[1st U-boat Flotilla Discord](https://discord.gg/DGeRx7BY9q)

## Development

```bash
npm install
npm run dev      # dev server
npm run build    # production build
npm run preview  # preview the built project
```
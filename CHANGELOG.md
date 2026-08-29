# Журнал изменений / Changelog

Все заметные изменения проекта фиксируются в этом файле.
All notable changes to this project are documented in this file.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
проект придерживается [Semantic Versioning](https://semver.org/lang/ru/).
Based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] / [Без релиза]

Пока без изменений. / Nothing here yet.

## [0.1.1] — 2026-08-29

### Добавлено

- Интерфейс полностью переведён на русский и английский языки: переключатель **RU/EN** в шапке, сохранение выбора языка между сессиями

### Added

- Interface fully localized into Russian and English: **RU/EN** switch in the header, language preference saved between sessions

## [0.1.0] — 2026-08-29

Первый выпуск. / Initial release.

### Добавлено

- Каркас приложения: Vite + Lit (веб-компоненты) + TypeScript
- **Дистанция** — расчёт дистанции по высоте цели (`H × K ÷ риски`), кратности ×1,5 (K = 92,5) и ×6 (K = 366), ориентир «мачта/труба», обратный расчёт риски по дистанции, шпаргалка «риски → дистанция»
- **Скорость** — расчёт скорости цели (`длина ÷ время прохода нос–корма × 1,94`), таблица времени прохода
- **КУЦ** — курсовой угол цели по видимой длине (`arcsin(Lвидим ÷ Lист)`), перевод риска ↔ метры, выбор борта (Л/П), шпаргалка «КУЦ → риски»
- **Метод Дика О'Кейна** — угол упреждения (`arctan(Vт ÷ Vторпеды)`), пеленг на выстрел, КУЦ на момент выстрела, общий случай упреждения с углом встречи, время хода торпеды
- **Справочник** — параметры военных кораблей (Flower, Bittern, Tribal), безопасные дистанции день/ночь, идентификация судов (3 способа)
- README на русском и английском со ссылкой на Discord DS 1 флотилии

### Added

- App scaffolding: Vite + Lit (web components) + TypeScript
- **Range** — compute range from target height (`H × K ÷ ticks`), magnifications ×1.5 (K = 92.5) and ×6 (K = 366), mast/funnel reference point, reverse calculation (ticks from a known range), "ticks → range" cheat sheet
- **Speed** — target speed (`length ÷ bow-to-stern transit time × 1.94`), transit time lookup table
- **AOB** — angle on the bow from visible length (`asin(Lvis ÷ Ltrue)`), ticks ↔ meters conversion, side selection (port/starboard), "AOB → ticks" cheat sheet
- **Dick O'Kane method** — lead angle (`atan(Vt ÷ Vtorpedo)`), firing bearing, target AOB at firing moment, general lead case with track angle, torpedo run time
- **Reference** — warship parameters (Flower, Bittern, Tribal), day/night safe ranges, ship identification (3 methods)
- README in Russian and English with a link to the 1st U-boat Flotilla Discord
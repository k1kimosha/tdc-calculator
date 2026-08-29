# Журнал изменений / Changelog

Все заметные изменения проекта фиксируются в этом файле.
All notable changes to this project are documented in this file.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
проект придерживается [Semantic Versioning](https://semver.org/lang/ru/).
Based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] / [Без релиза]

### Добавлено

- Документация переведена на **Markdown**: контент хранится в `public/docs/ru.md` и `public/docs/en.md` и рендерится мини-рендерером `src/markdown.ts` (заголовки, списки, код, формулы); в шапке документации показана версия приложения (`__APP_VERSION__` из `package.json`); раздел «Математический базис» переработан — каждая формула показана и в виде рендера, и как синтаксис для калькулятора; страница подгружается по языку интерфейса и перезагружается при его смене; тесты рендерера (`src/markdown.test.ts`) и панели
- Система i18n переработана: каждый язык в отдельном файле (`src/locales/ru.ts`, `src/locales/en.ts`), переключение через выпадающий список в шапке, автоопределение языка браузера при открытии (с фолбэком на английский), сохранение выбора между сессиями, ускоренный поиск переводов через плоский индекс, заголовок вкладки (`document.title`) тоже локализован
- Добавлены тесты i18n (**Vitest + happy-dom**): автоопределение языка при «загрузке страницы» (включая `html lang`) и фолбэк на английский при неподдерживаемом языке браузера; CI-воркфлоу `.github/workflows/test.yml` запускает сборку и тесты на каждый Pull Request в `master`
- Удалён мёртвый код из стартового шаблона: `src/my-element.ts`, `src/assets/`, `public/icons.svg`
- Подключены локальные шрифты **Noto Sans** (Google Fonts): файлы TTF лежат в `public/fonts/`, все 8 граней (400/500/600/700 + курсив) зарегистрированы через `@font-face` в `src/index.css` — шрифт раздаётся файлами из статики, без внешних запросов. Там же лежат китайские и японские грань (JP/SC/TC) про запас, в CSS пока не подключены
- Справочник стал редактируемым каталогом (хранение в `localStorage`, сервер не нужен): создание/редактирование/удаление классов кораблей (с флагом наличия палубного орудия), сценариев безопасных дистанций с переключателем **Надводное/Подводное** положение и произвольных дополнительных рекомендаций (работа с TDC, идентификация); экспорт/импорт каталога в/из локального JSON-файла, сброс к заводским данным; тесты стора (`src/tdc-store.test.ts`, 21 кейс)
- Формы каталога работают под актуальный язык страницы: название вводится только на текущем языке, другие языки заполняются после переключения языка — при этом черновик (даже несохранённый) не теряется при смене языка; если язык не локализован, подставляется название на исходном языке
- Добавлена вкладка **Документация** (`src/components/docs-panel.ts`, локализована RU/EN): пошаговое описание работы с каждым калькулятором, универсальный синтаксис формул (операторы, функции, константы, регистр), краткий математический базис (дистанция, скорость, КУЦ, упреждение, время хода торпеды) и руководство по работе со справочником
- **Редактируемые калькуляторы**: формулы всех четырёх калькуляторов (Дистанция, Скорость, КУЦ, Метод О'Кейна) стали пользовательскими — меняются в справочнике и хранятся вместе с каталогом (входят в экспорт/импорт JSON); новый универсальный синтаксис выражений (`src/formula-engine.ts`): арифметика с приоритетами, `^` справа-ассоциативный, унарные знаки, числовые константы `pi`/`e`/`tau`, переменные и функции без учёта регистра — тригонометрические (sin/cos/tan/asin/acos/atan/atan2), гиперболические, степень/корни, округление/знак, логарифмы, min/max/clamp, перевод градусы/радианы (rad/deg); ошибочное выражение подсвечивается в панели и в редакторе, при этом панель показывает текст ошибки вместо результата; тесты движка (`src/formula-engine.test.ts`) и стора

### Added

- Documentation moved to **Markdown**: content lives in `public/docs/ru.md` and `public/docs/en.md` and is rendered by the mini renderer `src/markdown.ts` (headings, lists, code, formulas); the documentation header shows the app version (`__APP_VERSION__` from `package.json`); the "Math basics" section was reworked — every formula is shown both rendered and as calculator syntax; the page loads per UI language and reloads when it changes; renderer tests (`src/markdown.test.ts`) and panel tests
- i18n system reworked: each language lives in its own file (`src/locales/ru.ts`, `src/locales/en.ts`), switching via a dropdown in the header, automatic browser-language detection on load (falling back to English), preference kept between sessions, faster lookup through a flattened translation index, and the browser tab title (`document.title`) is localized as well
- i18n tests added (**Vitest + happy-dom**): automatic language detection on page load (including `html lang`) and fallback to English for unsupported browser languages; CI workflow `.github/workflows/test.yml` runs the build and tests on every Pull Request to `master`
- Starter-template dead code removed: `src/my-element.ts`, `src/assets/`, `public/icons.svg`
- Local **Noto Sans** (Google Fonts) fonts wired up: TTF files live in `public/fonts/`, all 8 faces (400/500/600/700 + italic variants) are registered via `@font-face` in `src/index.css` — fonts are served as static files with no external requests. Chinese and Japanese faces (JP/SC/TC) are also stored there for the future, not yet wired into CSS
- Reference became an editable catalog (stored in `localStorage`, no backend needed): create/edit/delete ship classes (with a deck-gun flag), safe-range scenarios with a **Surface/Submerged** toggle, and arbitrary extra recommendations (TDC work, identification); catalog export/import to/from a local JSON file, factory-data reset; store tests (`src/tdc-store.test.ts`, 21 cases)
- Catalog forms follow the active page language: a name is entered only in the current language, other languages are filled in after switching the page language — the draft (even unsaved) survives a language switch; when a language is not localized, the entry falls back to the source language
- Docs tab added (`src/components/docs-panel.ts`, localized RU/EN): step-by-step usage notes for every calculator, the universal formula syntax (operators, functions, constants, case handling), a short math primer (range, speed, AOB, lead, torpedo run time) and a guide to working with the reference book
- **Editable calculators**: the formulas of all four calculators (Range, Speed, AOB, O'Kane method) became user-editable — they are changed in the reference and stored together with the catalog (included in the JSON export/import); a new universal expression syntax (`src/formula-engine.ts`): arithmetic with precedence, right-associative `^`, unary signs, numeric constants `pi`/`e`/`tau`, case-insensitive variables and functions — trigonometric (sin/cos/tan/asin/acos/atan/atan2), hyperbolic, powers/roots, rounding/sign, logarithms, min/max/clamp, degree/radian conversion (rad/deg); an invalid expression is highlighted in both the panel and the editor, and the panel shows the error text instead of a result; engine tests (`src/formula-engine.test.ts`) and store tests

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
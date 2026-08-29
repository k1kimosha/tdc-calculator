Noto Sans font files, served from /fonts/.

## Latin (подключены в src/index.css)
Регистрируются через @font-face, формат TTF (truetype), font-display: swap.

- NotoSans-Regular.ttf          (400, normal)
- NotoSans-Italic.ttf           (400, italic)
- NotoSans-Medium.ttf           (500, normal)
- NotoSans-MediumItalic.ttf     (500, italic)
- NotoSans-SemiBold.ttf         (600, normal)
- NotoSans-SemiBoldItalic.ttf   (600, italic)
- NotoSans-Bold.ttf             (700, normal)
- NotoSans-BoldItalic.ttf       (700, italic)

## CJK — JP / SC / TC (хранятся, пока НЕ зарегистрированы)
Файлы загружены «на всякий случай», в index.css не подключены:

- NotoSansJP-{Regular,Medium,SemiBold,Bold}.ttf
- NotoSansSC-{Regular,Medium,SemiBold,Bold}.ttf
- NotoSansTC-{Regular,Medium,SemiBold,Bold}.ttf

Почему не подключены: у всех трёх пересекающийся диапазон
unicode-range (U+4E00-9FFF иероглифы и т.п.). Одинаковые range заставят
браузер скачать все три семейства при первом же иероглифе (~15 МБ каждое).

Если когда-нибудь понадобится CJK в интерфейсе:
1. Сделать язык полной локалью (например 'ja', 'zh-Hans', 'zh-Hant' в <html lang>);
2. Зарегистрировать каждое семейство с отдельным @font-face (по весам);
3. Подключать через селектор :lang(ja) / :lang(zh-Hans) / :lang(zh-Hant),
   чтобы загружался только один файл под нужный язык.
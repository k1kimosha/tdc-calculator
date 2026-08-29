/**
 * Минималистичный рендерер Markdown для документации.
 * Поддерживает: заголовки h1-h4 (с якорями sec-N), списки ul/ol, параграфы,
 * `код` / **жирный** / *курсив*, блочные ```fences (lang `formula`
 * выводится в div.docs-formula для математических формул).
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderInline(text: string): string {
  let out = escapeHtml(text)
  out = out.replace(/`([^`]+)`/g, (_, code: string) => `<code>${code}</code>`)
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  return out
}

const FENCE_RE = /^```([a-z]*)\s*$/

/** Рендер Markdown-документа в HTML-строку. */
export function renderMarkdown(md: string): string {
  const lines = md.split(/\r?\n/)
  const out: string[] = []
  let i = 0
  let headingId = 0

  function flushList() {
    const items: string[] = []
    const ordered = /^\s*\d+\.\s+/.test(lines[i])
    const itemRe = ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*[-*]\s+(.*)$/
    while (i < lines.length && itemRe.test(lines[i])) {
      items.push(renderInline(lines[i].replace(itemRe, '$1')))
      i++
    }
    const tag = ordered ? 'ol' : 'ul'
    out.push(`<${tag}>${items.map(it => `<li>${it}</li>`).join('')}</${tag}>`)
  }

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    const fence = line.match(FENCE_RE)
    if (fence) {
      const lang = fence[1]
      i++
      const body: string[] = []
      while (i < lines.length && !FENCE_RE.test(lines[i])) {
        body.push(lines[i])
        i++
      }
      i++ // skip closing fence
      const content = escapeHtml(body.join('\n'))
      if (lang === 'formula') {
        out.push(`<div class="docs-formula">${body.join(' ').trim() ? escapeHtml(body.join(' ')) : content}</div>`)
      } else {
        out.push(`<pre><code>${content}</code></pre>`)
      }
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      const level = heading[1].length
      out.push(`<h${level} id="sec-${++headingId}">${renderInline(heading[2])}</h${level}>`)
      i++
      continue
    }

    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      flushList()
      continue
    }

    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !FENCE_RE.test(lines[i]) &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      para.push(lines[i])
      i++
    }
    out.push(`<p>${renderInline(para.join(' '))}</p>`)
  }

  return out.join('\n')
}

/** Вырезать все HTML-теги (для текстовых превью). */
export function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '')
}

/** Извлечь оглавление: заголовки h2 с их id (`sec-N`). */
export function extractSections(html: string): { id: string; title: string }[] {
  const out: { id: string; title: string }[] = []
  const re = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    out.push({ id: m[1], title: stripTags(m[2]).trim() })
  }
  return out
}
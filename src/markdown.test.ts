import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown.js'

describe('markdown renderer', () => {
  it('renders headings and paragraphs', () => {
    const html = renderMarkdown('# Title\n\nSome **bold** and `code` text.')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<code>code</code>')
    expect(html).toContain('<p>')
  })

  it('renders sub-headings', () => {
    const html = renderMarkdown('## H2\n### H3\n#### H4')
    expect(html).toContain('<h2>H2</h2>')
    expect(html).toContain('<h3>H3</h3>')
    expect(html).toContain('<h4>H4</h4>')
  })

  it('renders unordered and ordered lists', () => {
    const ul = renderMarkdown('- one\n- two')
    expect(ul).toContain('<ul><li>one</li><li>two</li></ul>')
    const ol = renderMarkdown('1. first\n2. second')
    expect(ol).toContain('<ol><li>first</li><li>second</li></ol>')
  })

  it('renders code fences', () => {
    const html = renderMarkdown('```\nh * k / r\n```')
    expect(html).toContain('<pre><code>h * k / r</code></pre>')
  })

  it('renders formula fences as docs-formula blocks', () => {
    const html = renderMarkdown('```formula\nD = H × K ÷ R\n```')
    expect(html).toContain('<div class="docs-formula">D = H × K ÷ R</div>')
  })

  it('escapes HTML in content', () => {
    const html = renderMarkdown('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('keeps both formula and syntax examples together', () => {
    const html = renderMarkdown('```formula\nA = B × C\n```\n```\na = b * c\n```')
    expect(html).toContain('<div class="docs-formula">A = B × C</div>')
    expect(html).toContain('<pre><code>a = b * c</code></pre>')
  })
})
import { readFile } from 'node:fs/promises'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { renderMarkdown } from './src/markdown.js'

const LOCALES = ['ru', 'en'] as const

function docsBuildPlugin(): Plugin {
  return {
    name: 'wpcalc-docs-compile',
    async generateBundle() {
      for (const locale of LOCALES) {
        const url = new URL(`./public/docs/${locale}.md`, import.meta.url)
        const md = await readFile(url, 'utf-8')
        this.emitFile({
          type: 'asset',
          fileName: `docs/${locale}.html`,
          source: renderMarkdown(md),
        })
      }
    },
  }
}

export default defineConfig({
  plugins: [docsBuildPlugin()],
})
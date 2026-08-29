/**
 * Общие браузерные утилиты для работы с файлами:
 * скачивание текстовых файлов и чтение загруженных файлов.
 * Панели журнала и справочника используют их для экспорта/импорта JSON.
 */

/** Скачивает текстовое содержимое как файл указанного MIME-типа. */
export function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Читает загруженный файл как текст (обёртка над FileReader). */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
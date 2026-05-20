/**
 * Формирует ИНВ (Идентификационный Номер Владельца).
 * Формат: {series_code}-{id с ведущими нулями до 6 цифр}
 * Пример: FB25-000001
 */
export function formatINV(userId: number, seriesCode: string): string {
  const padded = String(userId).padStart(6, '0')
  return `${seriesCode}-${padded}`
}

/**
 * Короткий ИНВ для отображения (без нулей в начале)
 * Пример: FB25-1
 */
export function formatINVShort(userId: number, seriesCode: string): string {
  return `${seriesCode}-${userId}`
}

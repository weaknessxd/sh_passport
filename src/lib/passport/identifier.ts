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

/**
 * Номер паспорта для карточки.
 * top    = порядковый номер юзера (4 цифры): 0001
 * bottom = месяц+год регистрации (MMYY):     0526
 * Отображается как «0001//» / «//0526».
 */
export function formatPassportNumber(
  userId: number,
  registeredAt?: string | Date | null,
): { top: string; bottom: string } {
  const num = String(userId).padStart(4, '0')

  let date = new Date()
  if (registeredAt) {
    const parsed = new Date(registeredAt)
    if (!Number.isNaN(parsed.getTime())) date = parsed
  }
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yy = String(date.getFullYear()).slice(2)

  return { top: `${num}//`, bottom: `//${mm}${yy}` }
}

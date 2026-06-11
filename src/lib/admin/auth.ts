import crypto from 'node:crypto'

/**
 * Проверка админ-пароля из заголовка x-admin-password.
 * Пароль задаётся env-переменной ADMIN_PASSWORD.
 * Если ADMIN_PASSWORD не задан — доступ закрыт (fail-closed).
 */
export function checkAdminAuth(request: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  const provided = request.headers.get('x-admin-password') ?? ''
  const a = crypto.createHash('sha256').update(provided).digest()
  const b = crypto.createHash('sha256').update(expected).digest()
  return crypto.timingSafeEqual(a, b)
}

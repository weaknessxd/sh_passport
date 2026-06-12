// E2E-проверка выдачи штампов через реальное API на localhost.
// Генерирует валидную initData (HMAC с ботовским токеном), создаёт тестового
// юзера, проверяет сценарии клейма, затем удаляет тестового юзера.
import crypto from 'node:crypto'
import { db } from '@/lib/db/client'
import { users, stamps } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const TG_ID = 999000111

function buildInitData(botToken: string): string {
  const params = new URLSearchParams()
  params.set('query_id', 'AAtest')
  params.set('user', JSON.stringify({ id: TG_ID, first_name: 'E2E', username: 'e2e_test_user' }))
  params.set('auth_date', String(Math.floor(Date.now() / 1000)))

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')
  params.set('hash', hash)
  return params.toString()
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: res.status, json: (await res.json()) as Record<string, unknown> }
}

function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${JSON.stringify(detail)}` : ''}`)
  if (!ok) process.exitCode = 1
}

async function main() {
  const botToken = process.env.TG_BOT_TOKEN
  if (!botToken) throw new Error('TG_BOT_TOKEN not set')
  const initData = buildInitData(botToken)

  // 0. чистим возможные остатки прошлых прогонов
  await db.delete(users).where(eq(users.tg_id, BigInt(TG_ID)))

  // 1. auth/validate создаёт юзера
  const auth = await post('/api/auth/validate', { initData })
  check('auth/validate 200 + юзер создан', auth.status === 200 && Boolean((auth.json.user as { id?: number })?.id))

  // 2. клейм мерч-заказа → штамп выдан
  const merch = await post('/api/stamps/claim', { initData, order_id: 'TEST-004', email: 'ivan@example.com' })
  check('TEST-004 (мерч) → штамп выдан', merch.status === 200, merch.json.error ?? merch.json.stamp)

  // 3. повторный клейм того же заказа → 409
  const dup = await post('/api/stamps/claim', { initData, order_id: 'TEST-004', email: 'ivan@example.com' })
  check('TEST-004 повторно → 409', dup.status === 409, dup.json.error)

  // 4. курс не пройден → 403
  const notPassed = await post('/api/stamps/claim', { initData, order_id: 'TEST-003', email: 'test@shchelochi.ru' })
  check('TEST-003 (курс не пройден) → 403', notPassed.status === 403, notPassed.json.error)

  // 5. курс пройден → штамп выдан
  const course = await post('/api/stamps/claim', { initData, order_id: 'TEST-002', email: 'test@shchelochi.ru' })
  check('TEST-002 (курс пройден) → штамп выдан', course.status === 200, course.json.error ?? course.json.stamp)

  // 6. неверный email → 404
  const wrong = await post('/api/stamps/claim', { initData, order_id: 'TEST-001', email: 'wrong@mail.ru' })
  check('TEST-001 с чужим email → 404', wrong.status === 404, wrong.json.error)

  // 7. список штампов: 2 шт, иконки — существующий SVG
  const list = await post('/api/user/stamps', { initData })
  const stampsList = (list.json.stamps ?? []) as Array<{ name: string; icon: string | null }>
  check('user/stamps → 2 штампа', stampsList.length === 2, stampsList.map((s) => s.name))
  check('иконки штампов — SVG-путь', stampsList.every((s) => s.icon === '/icons/logo.svg'), stampsList.map((s) => s.icon))

  // 8. публичная тема отдаётся
  const themeRes = await fetch(`${BASE}/api/theme`)
  const themeJson = (await themeRes.json()) as { theme_config?: { onboarding?: { button_bg?: string } } }
  check('/api/theme → конфиг с onboarding', themeRes.status === 200 && Boolean(themeJson.theme_config?.onboarding?.button_bg))

  // 9. админ API: без пароля 401, с паролем 200
  const noAuth = await fetch(`${BASE}/api/admin/orders`)
  check('admin без пароля → 401', noAuth.status === 401)
  const withAuth = await fetch(`${BASE}/api/admin/orders`, { headers: { 'x-admin-password': process.env.ADMIN_PASSWORD ?? '' } })
  check('admin с паролем → 200', withAuth.status === 200)

  // 10. очистка: удаляем тестового юзера (штампы каскадом) — заказы снова свободны
  const del = await db.delete(users).where(eq(users.tg_id, BigInt(TG_ID))).returning({ id: users.id })
  const orphan = await db.select().from(stamps).where(eq(stamps.source_id, 'TEST-004'))
  check('очистка: юзер удалён, штампы каскадом', del.length === 1 && orphan.length === 0)

  console.log('\nГотово.')
}

main().then(() => process.exit(process.exitCode ?? 0)).catch((e) => { console.error(e); process.exit(1) })

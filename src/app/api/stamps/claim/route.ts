import { NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { validateInitData, InitDataValidationError } from '@/lib/telegram/validate-init-data'
import { db } from '@/lib/db/client'
import { users, stamps, stampTypes, insalesOrders } from '@/lib/db/schema'

const bodySchema = z.object({
  initData: z.string().min(1),
  order_id: z.string().min(1).trim(),
  email: z.string().email().trim().toLowerCase(),
})

/** Определяем тип штампа по product_type заказа */
async function resolveStampType(productType: string | null): Promise<number | null> {
  const allTypes = await db.select().from(stampTypes)

  if (!productType) {
    // Если тип неизвестен — берём первый доступный
    return allTypes[0]?.id ?? null
  }

  const lower = productType.toLowerCase()

  // Ищем по ключевым словам в названии типа штампа
  if (lower.includes('course') || lower.includes('курс')) {
    const found = allTypes.find((t) =>
      t.name.toLowerCase().includes('курс') || t.name.toLowerCase().includes('course'),
    )
    if (found) return found.id
  }

  if (lower.includes('merch') || lower.includes('мерч')) {
    const found = allTypes.find((t) =>
      t.name.toLowerCase().includes('мерч') || t.name.toLowerCase().includes('merch'),
    )
    if (found) return found.id
  }

  // Дефолт — первый тип
  return allTypes[0]?.id ?? null
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Проверь правильность введённых данных', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { initData, order_id, email } = parsed.data

  const botToken = process.env.TG_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })
  }

  // Валидируем Telegram initData
  let validated
  try {
    validated = validateInitData(initData, botToken)
  } catch (e) {
    if (e instanceof InitDataValidationError) {
      return NextResponse.json({ error: e.message }, { status: 401 })
    }
    throw e
  }

  const tgId = BigInt(validated.user.id)

  // Находим юзера
  const userRows = await db.select().from(users).where(eq(users.tg_id, tgId)).limit(1)
  const user = userRows[0] ?? null
  if (!user) {
    return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
  }

  // Ищем заказ по id + email
  const orderRows = await db
    .select()
    .from(insalesOrders)
    .where(and(eq(insalesOrders.id, order_id), eq(insalesOrders.email, email)))
    .limit(1)

  const order = orderRows[0] ?? null

  if (!order) {
    return NextResponse.json(
      { error: 'Заказ не найден. Проверь номер заказа и email.' },
      { status: 404 },
    )
  }

  // Если курс — проверяем флаг course_passed
  const isCourse =
    order.product_type?.toLowerCase().includes('course') ||
    order.product_type?.toLowerCase().includes('курс')

  if (isCourse && !order.course_passed) {
    return NextResponse.json(
      { error: 'Курс ещё не завершён. Штамп выдаётся после прохождения.' },
      { status: 403 },
    )
  }

  // Проверяем — штамп по этому заказу уже выдан (кому угодно)?
  // Один заказ = один штамп, иначе чужой использованный заказ можно заклеймить повторно.
  const existingStamp = await db
    .select()
    .from(stamps)
    .where(eq(stamps.source_id, order_id))
    .limit(1)

  if (existingStamp[0]) {
    return NextResponse.json(
      { error: 'Штамп по этому заказу уже получен.' },
      { status: 409 },
    )
  }

  // Определяем тип штампа
  const stampTypeId = await resolveStampType(order.product_type ?? null)
  if (!stampTypeId) {
    return NextResponse.json({ error: 'Тип штампа не найден' }, { status: 500 })
  }

  // Выдаём штамп
  const newStamp = await db
    .insert(stamps)
    .values({
      user_id: user.id,
      stamp_type_id: stampTypeId,
      source_id: order_id,
    })
    .returning()

  const stamp = newStamp[0]
  if (!stamp) {
    return NextResponse.json({ error: 'Не удалось выдать штамп' }, { status: 500 })
  }

  // Получаем название типа для ответа
  const typeRows = await db.select().from(stampTypes).where(eq(stampTypes.id, stampTypeId)).limit(1)
  const typeName = typeRows[0]?.name ?? 'Штамп'

  return NextResponse.json({
    ok: true,
    stamp: {
      id: stamp.id,
      name: typeName,
      issued_at: stamp.issued_at,
      source_id: order_id,
    },
  })
}

import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { validateInitData, InitDataValidationError } from '@/lib/telegram/validate-init-data'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'

const bodySchema = z.object({
  initData: z.string().min(1),
  first_name: z.string().min(1).max(64).trim().optional(),
  last_name: z.string().max(64).trim().optional(),
  email: z.string().email().optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { initData, ...fields } = parsed.data

  const botToken = process.env.TG_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })
  }

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
  const existing = await db.select().from(users).where(eq(users.tg_id, tgId)).limit(1)
  const user = existing[0] ?? null
  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  // Обновляем только переданные поля
  const updateData: Record<string, string> = {}
  if (fields.first_name) updateData['first_name'] = fields.first_name
  if (fields.last_name !== undefined) updateData['last_name'] = fields.last_name
  if (fields.email) updateData['email'] = fields.email
  if (fields.birth_date) updateData['birth_date'] = fields.birth_date

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'no fields to update' }, { status: 400 })
  }

  const updated = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, user.id))
    .returning()

  const u = updated[0]
  if (!u) {
    return NextResponse.json({ error: 'update failed' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: u.id,
      tg_id: String(u.tg_id),
      tg_username: u.tg_username,
      first_name: u.first_name,
      last_name: u.last_name,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      onboarded: Boolean(u.first_name && u.email),
    },
  })
}

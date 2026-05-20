import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import crypto from 'node:crypto'
import { validateInitData, InitDataValidationError } from '@/lib/telegram/validate-init-data'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'

const bodySchema = z.object({
  initData: z.string().min(1),
  password: z.string().min(1),
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
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const { initData, password } = parsed.data

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
  const existing = await db.select().from(users).where(eq(users.tg_id, tgId)).limit(1)
  const user = existing[0] ?? null
  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  if (!user.password_hash) {
    return NextResponse.json({ error: 'no password set' }, { status: 400 })
  }

  const hash = crypto.createHash('sha256').update(password).digest('hex')
  const match = crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(user.password_hash, 'hex'),
  )

  if (!match) {
    return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      tg_id: String(user.tg_id),
      tg_username: user.tg_username,
      first_name: user.first_name,
      last_name: user.last_name,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      onboarded: Boolean(user.email),
      has_password: true,
    },
  })
}

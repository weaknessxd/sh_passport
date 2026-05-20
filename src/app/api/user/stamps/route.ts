import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { validateInitData, InitDataValidationError } from '@/lib/telegram/validate-init-data'
import { db } from '@/lib/db/client'
import { users, stamps, stampTypes } from '@/lib/db/schema'

const bodySchema = z.object({
  initData: z.string().min(1),
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

  const botToken = process.env.TG_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })
  }

  let validated
  try {
    validated = validateInitData(parsed.data.initData, botToken)
  } catch (e) {
    if (e instanceof InitDataValidationError) {
      return NextResponse.json({ error: e.message }, { status: 401 })
    }
    throw e
  }

  const tgId = BigInt(validated.user.id)
  const userRows = await db.select().from(users).where(eq(users.tg_id, tgId)).limit(1)
  const user = userRows[0] ?? null
  if (!user) {
    return NextResponse.json({ stamps: [] })
  }

  const userStamps = await db
    .select({
      id: stamps.id,
      name: stampTypes.name,
      icon: stampTypes.icon,
      issued_at: stamps.issued_at,
    })
    .from(stamps)
    .innerJoin(stampTypes, eq(stamps.stamp_type_id, stampTypes.id))
    .where(eq(stamps.user_id, user.id))

  return NextResponse.json({
    stamps: userStamps.map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      issued_at: s.issued_at ? s.issued_at.toISOString() : null,
    })),
  })
}

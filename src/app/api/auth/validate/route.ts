// src/app/api/auth/validate/route.ts
//
// POST /api/auth/validate
// Body: { initData: string }
//
// Принимает initData от TMA, валидирует HMAC, находит/создаёт юзера в БД.
// Клиент дёргает этот эндпоинт при старте, чтобы убедиться в авторизации
// и получить актуального юзера.

import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import {
  validateInitData,
  InitDataValidationError,
} from '@/lib/telegram/validate-init-data'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'

export async function POST(request: Request) {
  let body: { initData?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid JSON body' },
      { status: 400 },
    )
  }

  if (!body.initData) {
    return NextResponse.json(
      { error: 'initData is required' },
      { status: 400 },
    )
  }

  const botToken = process.env.TG_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json(
      { error: 'server misconfigured' },
      { status: 500 },
    )
  }

  let validated
  try {
    validated = validateInitData(body.initData, botToken)
  } catch (e) {
    if (e instanceof InitDataValidationError) {
      return NextResponse.json({ error: e.message }, { status: 401 })
    }
    throw e
  }

  // upsert юзера по tg_id
  const tgId = BigInt(validated.user.id)

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.tg_id, tgId))
    .limit(1)

  let user = existing[0] ?? null
  let isNew = false

  if (!user) {
    const inserted = await db
      .insert(users)
      .values({
        tg_id: tgId,
        tg_username: validated.user.username ?? null,
      })
      .returning()
    const newUser = inserted[0]
    if (!newUser) {
      return NextResponse.json({ error: 'failed to create user' }, { status: 500 })
    }
    user = newUser
    isNew = true
  } else if (
    validated.user.username &&
    validated.user.username !== user.tg_username
  ) {
    await db
      .update(users)
      .set({ tg_username: validated.user.username })
      .where(eq(users.id, user.id))
    user.tg_username = validated.user.username
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
      birth_date: user.birth_date ?? null,
      onboarded: Boolean(user.email),
      has_password: Boolean(user.password_hash),
    },
    is_new: isNew,
  })
}

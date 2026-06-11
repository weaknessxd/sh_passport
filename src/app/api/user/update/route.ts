import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import crypto from 'node:crypto'
import { validateInitData, InitDataValidationError } from '@/lib/telegram/validate-init-data'
import { db } from '@/lib/db/client'
import { users, presets } from '@/lib/db/schema'
import { resolveTheme } from '@/lib/passport/theme'

const bodySchema = z.object({
  initData: z.string().min(1),
  first_name: z.string().min(1).max(64).trim().optional(),
  last_name: z.string().max(64).trim().optional(),
  display_name: z.string().max(64).trim().optional(),
  email: z.string().email().trim().toLowerCase().optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  region_issued: z.string().max(64).trim().optional(),
  city: z.string().max(64).trim().optional(),
  gender: z.enum(['М', 'Ж', 'Щ']).optional(),
  theme: z.string().max(64).trim().optional(),
  skill_badges: z.array(z.string().max(40)).max(6).optional(),
  onboarded: z.boolean().optional(),
  signature_text: z.string().max(128).trim().optional(),
  about_owner: z.string().max(256).trim().optional(),
  // base64 data URL (max ~600 KB after JPEG compression)
  avatar_url: z.string().max(900_000).optional(),
  // SVG string for handwritten signature
  signature_svg: z.string().max(500_000).optional(),
  password: z.string().min(4).max(128).optional(),
})

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function buildUserResponse(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    tg_id: String(u.tg_id),
    tg_username: u.tg_username,
    first_name: u.first_name,
    last_name: u.last_name,
    display_name: u.display_name,
    email: u.email,
    birth_date: u.birth_date,
    gender: u.gender,
    region_issued: u.region_issued,
    city: u.region_issued,
    theme: u.theme,
    skill_badges: (u.skill_badges as string[] | null) ?? [],
    signature_text: u.signature_text,
    signature_svg: u.signature_svg,
    about_owner: u.about_owner,
    avatar_url: u.avatar_url,
    registered_at: u.registered_at ? u.registered_at.toISOString() : null,
    onboarded: Boolean(u.onboarded),
    has_password: Boolean(u.password_hash),
  }
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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { initData, password, ...fields } = parsed.data

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

  // Собираем обновляемые поля (только те что пришли)
  const updateData: Partial<typeof users.$inferInsert> = {}
  if (fields.first_name !== undefined) updateData.first_name = fields.first_name
  if (fields.last_name !== undefined) updateData.last_name = fields.last_name || null
  if (fields.display_name !== undefined) updateData.display_name = fields.display_name || null
  if (fields.email !== undefined) updateData.email = fields.email
  if (fields.birth_date !== undefined) updateData.birth_date = fields.birth_date || null
  if (fields.region_issued !== undefined) updateData.region_issued = fields.region_issued || null
  if (fields.city !== undefined) updateData.region_issued = fields.city || null
  if (fields.gender !== undefined) updateData.gender = fields.gender || null
  if (fields.theme !== undefined) updateData.theme = fields.theme || null
  if (fields.skill_badges !== undefined) updateData.skill_badges = fields.skill_badges
  if (fields.onboarded !== undefined) updateData.onboarded = fields.onboarded
  if (fields.signature_text !== undefined) updateData.signature_text = fields.signature_text || null
  if (fields.about_owner !== undefined) updateData.about_owner = fields.about_owner || null
  if (fields.avatar_url !== undefined) updateData.avatar_url = fields.avatar_url || null
  if (fields.signature_svg !== undefined) updateData.signature_svg = fields.signature_svg || null
  if (password) updateData.password_hash = hashPassword(password)

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

  return NextResponse.json({ ok: true, user: buildUserResponse(u) })
}

// GET — получить текущие данные профиля
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const initData = searchParams.get('initData')

  if (!initData) {
    return NextResponse.json({ error: 'initData required' }, { status: 400 })
  }

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

  // Конфиг активной темы пользователя (или дефолтной, если не назначена)
  let presetRow = user.active_preset_id
    ? (await db.select().from(presets).where(eq(presets.id, user.active_preset_id)).limit(1))[0] ?? null
    : null
  if (!presetRow) {
    presetRow = (await db.select().from(presets).where(eq(presets.is_default, true)).limit(1))[0] ?? null
  }
  const themeConfig = resolveTheme(presetRow?.config)

  return NextResponse.json({ user: buildUserResponse(user), theme_config: themeConfig })
}

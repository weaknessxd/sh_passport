import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { presets } from '@/lib/db/schema'
import { checkAdminAuth } from '@/lib/admin/auth'
import { DEFAULT_THEME } from '@/lib/passport/theme'

// GET — список тем
export async function GET(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const all = await db.select().from(presets).orderBy(desc(presets.created_at))
  return NextResponse.json({ themes: all, default_config: DEFAULT_THEME })
}

const themeConfigSchema = z.object({
  colors: z.object({
    card_bg: z.string(),
    accent: z.string(),
    text: z.string(),
    label: z.string(),
    border: z.string(),
    badge_bg: z.string(),
  }),
  watermark_main: z.string(),
  watermark_stamps: z.string(),
  issuer: z.string(),
  issue_date: z.string(),
  mrz_prefix: z.string(),
})

const createSchema = z.object({
  name: z.string().min(1).max(64),
  series_code: z.string().min(1).max(16),
  config: themeConfigSchema,
  make_default: z.boolean().optional(),
})

// POST — создать тему
export async function POST(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, series_code, config, make_default } = parsed.data

  if (make_default) {
    await db.update(presets).set({ is_default: false })
  }

  const inserted = await db
    .insert(presets)
    .values({ name, series_code, config, is_default: make_default ?? false })
    .returning()

  return NextResponse.json({ ok: true, theme: inserted[0] })
}

const patchSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1).max(64).optional(),
  series_code: z.string().min(1).max(16).optional(),
  config: themeConfigSchema.optional(),
  make_default: z.boolean().optional(),
})

// PATCH — обновить тему / назначить активной для новых пользователей
export async function PATCH(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { id, name, series_code, config, make_default } = parsed.data

  if (make_default) {
    // Единственная активная тема
    await db.update(presets).set({ is_default: false })
  }

  const updateData: Partial<typeof presets.$inferInsert> = {}
  if (name !== undefined) updateData.name = name
  if (series_code !== undefined) updateData.series_code = series_code
  if (config !== undefined) updateData.config = config
  if (make_default !== undefined) updateData.is_default = make_default

  const updated = await db.update(presets).set(updateData).where(eq(presets.id, id)).returning()
  if (!updated[0]) {
    return NextResponse.json({ error: 'theme not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, theme: updated[0] })
}

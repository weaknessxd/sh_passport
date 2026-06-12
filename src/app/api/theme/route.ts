import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { presets } from '@/lib/db/schema'
import { resolveTheme } from '@/lib/passport/theme'

// GET — конфиг активной (дефолтной) темы. Публичный: нужен онбордингу
// до того, как пользователь авторизован.
export async function GET() {
  const row = (await db.select().from(presets).where(eq(presets.is_default, true)).limit(1))[0] ?? null
  return NextResponse.json({ theme_config: resolveTheme(row?.config) })
}

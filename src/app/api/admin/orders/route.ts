import { NextResponse } from 'next/server'
import { desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { parse } from 'csv-parse/sync'
import { db } from '@/lib/db/client'
import { insalesOrders } from '@/lib/db/schema'
import { checkAdminAuth } from '@/lib/admin/auth'

// GET — последние заказы
export async function GET(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const orders = await db
    .select()
    .from(insalesOrders)
    .orderBy(desc(insalesOrders.created_at))
    .limit(100)
  return NextResponse.json({ orders })
}

type CsvRow = {
  id: string
  email: string
  status: string
  product_type?: string
  created_at?: string
}

const importSchema = z.object({ csv: z.string().min(1) })

// POST — импорт CSV (то же поведение, что CLI-скрипт:
// upsert по id, course_passed не перетирается)
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
  const parsed = importSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'csv field required' }, { status: 400 })
  }

  let rows: CsvRow[]
  try {
    rows = parse(parsed.data.csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRow[]
  } catch (e) {
    return NextResponse.json(
      { error: `Ошибка разбора CSV: ${e instanceof Error ? e.message : String(e)}` },
      { status: 400 },
    )
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'CSV пуст' }, { status: 400 })
  }

  const required = ['id', 'email', 'status'] as const
  const first = rows[0]!
  const missing = required.filter((f) => !(f in first))
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Нет обязательных колонок: ${missing.join(', ')}. Найдены: ${Object.keys(first).join(', ')}` },
      { status: 400 },
    )
  }

  let processed = 0
  const errors: Array<{ row: number; id: string; error: string }> = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    try {
      const createdAt = row.created_at ? new Date(row.created_at) : new Date()
      if (Number.isNaN(createdAt.getTime())) throw new Error(`invalid created_at: ${row.created_at}`)

      await db
        .insert(insalesOrders)
        .values({
          id: String(row.id).trim(),
          email: row.email.toLowerCase().trim(),
          status: row.status.trim(),
          product_type: row.product_type?.trim() || null,
          created_at: createdAt,
        })
        .onConflictDoUpdate({
          target: insalesOrders.id,
          set: {
            email: sql`excluded.email`,
            status: sql`excluded.status`,
            product_type: sql`excluded.product_type`,
            // course_passed и created_at не перетираются
          },
        })
      processed++
    } catch (e) {
      errors.push({ row: i + 2, id: row.id ?? '?', error: e instanceof Error ? e.message : String(e) })
    }
  }

  return NextResponse.json({ ok: true, processed, skipped: errors.length, errors: errors.slice(0, 20) })
}

const patchSchema = z.object({
  id: z.string().min(1),
  course_passed: z.boolean(),
})

// PATCH — переключить course_passed у заказа
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
    return NextResponse.json({ error: 'id + course_passed required' }, { status: 400 })
  }

  const updated = await db
    .update(insalesOrders)
    .set({ course_passed: parsed.data.course_passed })
    .where(eq(insalesOrders.id, parsed.data.id))
    .returning()

  if (!updated[0]) {
    return NextResponse.json({ error: 'order not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, order: updated[0] })
}

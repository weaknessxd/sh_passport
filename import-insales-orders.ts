// scripts/import-insales-orders.ts
//
// CLI-скрипт для ручного импорта заказов InSales из CSV-экспорта.
//
// Использование:
//   pnpm tsx scripts/import-insales-orders.ts ./data/insales-export.csv
//
// Ожидаемые колонки CSV (можно настроить под формат экспорта InSales):
//   id           - номер заказа (строка)
//   email        - email покупателя
//   status       - статус заказа ("paid", "pending", "cancelled", ...)
//   product_type - тип товара ("course", "merch", "event", ...)
//   created_at   - дата создания (ISO 8601)
//
// Поведение:
//   - upsert по id заказа
//   - course_passed НЕ перетирается (его проставляют вручную через DB-клиент)
//   - email нормализуется (lowercase + trim)
//   - дубликаты в CSV безопасны — обновится последняя версия

import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'csv-parse/sync'
import { sql } from 'drizzle-orm'
import { db } from '../src/lib/db/client'
import { insalesOrders } from '../src/lib/db/schema'

type CsvRow = {
  id: string
  email: string
  status: string
  product_type?: string
  created_at: string
}

const REQUIRED_FIELDS = ['id', 'email', 'status', 'created_at'] as const

async function main() {
  const csvPath = process.argv[2]
  if (!csvPath) {
    console.error('Usage: pnpm tsx scripts/import-insales-orders.ts <path-to-csv>')
    process.exit(1)
  }

  const absPath = path.resolve(csvPath)
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`)
    process.exit(1)
  }

  const content = fs.readFileSync(absPath, 'utf-8')

  let rows: CsvRow[]
  try {
    rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRow[]
  } catch (e) {
    console.error('CSV parse error:', e)
    process.exit(1)
  }

  console.log(`Parsed ${rows.length} rows from ${csvPath}`)

  // Валидация: проверяем что все обязательные колонки есть
  if (rows.length > 0) {
    const firstRow = rows[0]
    const missing = REQUIRED_FIELDS.filter((f) => !(f in firstRow))
    if (missing.length > 0) {
      console.error(`Missing required columns: ${missing.join(', ')}`)
      console.error(`Found columns: ${Object.keys(firstRow).join(', ')}`)
      process.exit(1)
    }
  }

  let processed = 0
  let skipped = 0
  const errors: Array<{ row: number; id: string; error: string }> = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const createdAt = new Date(row.created_at)
      if (Number.isNaN(createdAt.getTime())) {
        throw new Error(`invalid created_at: ${row.created_at}`)
      }

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
            // course_passed НЕ обновляется — это локальный флаг
            // created_at НЕ обновляется — оригинальная дата заказа
          },
        })

      processed++
    } catch (e) {
      skipped++
      errors.push({
        row: i + 2, // +1 за header, +1 за человеческую нумерацию
        id: row.id,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  console.log('')
  console.log('=== Import summary ===')
  console.log(`Processed: ${processed}`)
  console.log(`Skipped:   ${skipped}`)

  if (errors.length > 0) {
    console.log('')
    console.log('=== Errors ===')
    for (const err of errors.slice(0, 20)) {
      console.log(`  Row ${err.row} (id=${err.id}): ${err.error}`)
    }
    if (errors.length > 20) {
      console.log(`  ... and ${errors.length - 20} more`)
    }
  }

  process.exit(errors.length > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})

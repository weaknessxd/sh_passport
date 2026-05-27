import { db } from '@/lib/db/client'
import { insalesOrders } from '@/lib/db/schema'

const orders = [
  { id: 'TEST-001', email: 'test@shchelochi.ru', status: 'paid', product_type: 'merch',  course_passed: false },
  { id: 'TEST-002', email: 'test@shchelochi.ru', status: 'paid', product_type: 'course', course_passed: true  },
  { id: 'TEST-003', email: 'test@shchelochi.ru', status: 'paid', product_type: 'course', course_passed: false },
  { id: 'TEST-004', email: 'ivan@example.com',   status: 'paid', product_type: 'merch',  course_passed: false },
  { id: 'TEST-005', email: 'ivan@example.com',   status: 'paid', product_type: 'course', course_passed: true  },
]

async function main() {
  const inserted = await db
    .insert(insalesOrders)
    .values(orders.map((o) => ({ ...o, created_at: new Date() })))
    .onConflictDoNothing()
    .returning()

  console.log(`Вставлено: ${inserted.length} заказов`)
  inserted.forEach((o) => console.log(`  ${o.id}  ${o.email}  ${o.product_type}  course_passed=${o.course_passed}`))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })

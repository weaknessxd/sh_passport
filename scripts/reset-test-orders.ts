import { db } from '@/lib/db/client'
import { insalesOrders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const all = await db.select().from(insalesOrders)
  console.log(JSON.stringify(all.map((o) => ({ id: o.id, course_passed: o.course_passed }))))
  await db.update(insalesOrders).set({ course_passed: false }).where(eq(insalesOrders.id, 'TEST-003'))
  console.log('TEST-003 → course_passed=false')
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })

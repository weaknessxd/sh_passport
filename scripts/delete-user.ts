import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const username = process.argv[2]
  if (!username) { console.error('Usage: tsx delete-user.ts <tg_username>'); process.exit(1) }

  const found = await db.select().from(users).where(eq(users.tg_username, username)).limit(1)
  const user = found[0]
  if (!user) { console.log('Пользователь не найден:', username); return }

  console.log('Найден:', user.id, user.tg_username, user.email)
  await db.delete(users).where(eq(users.id, user.id))
  console.log('Удалён')
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })

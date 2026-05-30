import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { isNotNull } from 'drizzle-orm'

async function main() {
  const found = await db
    .select({ id: users.id, username: users.tg_username, email: users.email })
    .from(users)
    .where(isNotNull(users.tg_username))

  if (!found.length) {
    console.log('Пользователей с tg_username не найдено')
    return
  }

  console.log(`Найдено ${found.length} пользователей:`)
  found.forEach((u) => console.log(`  id=${u.id}  @${u.username}  ${u.email ?? '—'}`))

  const deleted = await db.delete(users).where(isNotNull(users.tg_username)).returning({ id: users.id })
  console.log(`\nУдалено: ${deleted.length}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })

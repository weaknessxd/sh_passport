import { db } from '@/lib/db/client'
import { stampTypes } from '@/lib/db/schema'
import { like } from 'drizzle-orm'

// Сидовые иконки указывали на несуществующие файлы /presets/football/stamps/*.svg.
// Меняем на существующий SVG (лого Щ) — дальше можно заменить на дизайнерские.
async function main() {
  const updated = await db
    .update(stampTypes)
    .set({ icon: '/icons/logo.svg' })
    .where(like(stampTypes.icon, '/presets/%'))
    .returning({ id: stampTypes.id, name: stampTypes.name, icon: stampTypes.icon })

  console.log(`Обновлено: ${updated.length}`)
  updated.forEach((t) => console.log(`  ${t.id} ${t.name} → ${t.icon}`))

  const all = await db.select().from(stampTypes)
  console.log('Все типы штампов:', JSON.stringify(all.map((t) => ({ id: t.id, name: t.name, icon: t.icon }))))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })

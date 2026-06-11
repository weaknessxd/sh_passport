import { db } from '@/lib/db/client'
import { presets } from '@/lib/db/schema'
import { DEFAULT_THEME } from '@/lib/passport/theme'

async function main() {
  const all = await db
    .select({ id: presets.id, name: presets.name, def: presets.is_default })
    .from(presets)
  console.log('Существующие темы:', JSON.stringify(all))

  const hasDefault = all.some((p) => p.def)
  if (hasDefault) {
    console.log('Дефолтная тема уже есть — пропускаю')
    return
  }

  const inserted = await db
    .insert(presets)
    .values({
      name: 'Цифровой эскапизм',
      series_code: 'TM26',
      config: DEFAULT_THEME,
      is_default: true,
    })
    .returning({ id: presets.id, name: presets.name })
  console.log('Создана дефолтная тема:', JSON.stringify(inserted))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })

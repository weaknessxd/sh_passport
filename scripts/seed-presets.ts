import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '../src/lib/db/schema'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const client = postgres(DATABASE_URL)
const db = drizzle(client, { schema })

async function seed() {
  console.log('Seeding presets...')

  const [preset] = await db
    .insert(schema.presets)
    .values({
      name: 'Футбол 2025',
      series_code: 'FB25',
      config: {
        backgrounds: '/presets/football/backgrounds/',
        stamps: '/presets/football/stamps/',
        colors: {
          primary: '#1a1a2e',
          accent: '#e94560',
          text: '#ffffff',
        },
        pages: 16,
      },
    })
    .onConflictDoNothing()
    .returning()

  if (preset) {
    console.log(`Created preset: ${preset.name} (id=${preset.id})`)
  } else {
    console.log('Preset already exists, skipped')
  }

  console.log('Seeding stamp types...')

  await db
    .insert(schema.stampTypes)
    .values([
      { name: 'Прохождение курса', icon: '/presets/football/stamps/course.svg' },
      { name: 'Покупка мерча', icon: '/presets/football/stamps/merch.svg' },
    ])
    .onConflictDoNothing()

  console.log('Done!')
  await client.end()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})

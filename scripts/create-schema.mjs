import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)
await sql`CREATE SCHEMA IF NOT EXISTS passport`
console.log('Schema passport created')
await sql.end()

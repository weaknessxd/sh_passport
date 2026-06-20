import crypto from 'node:crypto'
import { validateInitData } from '@/lib/telegram/validate-init-data'

const TOKEN = 'test-bot-token-123'

function sign(fields: Record<string, string>): string {
  const p = new URLSearchParams(fields)
  const dcs = Array.from(p.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
  const secret = crypto.createHmac('sha256', 'WebAppData').update(TOKEN).digest()
  const hash = crypto.createHmac('sha256', secret).update(dcs).digest('hex')
  p.set('hash', hash)
  return p.toString()
}

const base = {
  user: JSON.stringify({ id: 1, first_name: 'A' }),
  auth_date: String(Math.floor(Date.now() / 1000)),
}

// 1) без signature
try {
  validateInitData(sign(base), TOKEN)
  console.log('✅ без signature — OK')
} catch (e) {
  console.log('❌ без signature:', (e as Error).message)
  process.exitCode = 1
}

// 2) со signature (добавляется ПОСЛЕ вычисления hash, как делает Telegram)
const p = new URLSearchParams(sign(base))
p.set('signature', 'abc123ed25519signature')
try {
  validateInitData(p.toString(), TOKEN)
  console.log('✅ со signature — OK (поле исключается из проверки)')
} catch (e) {
  console.log('❌ со signature:', (e as Error).message)
  process.exitCode = 1
}

process.exit(process.exitCode ?? 0)

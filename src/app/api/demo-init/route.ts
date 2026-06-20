import crypto from 'node:crypto'
import { NextResponse } from 'next/server'

// Демо-режим: выдаёт валидную initData (подписанную настоящим ботовским
// токеном) для просмотра приложения в обычном браузере, без Telegram.
// Включается только если NEXT_PUBLIC_DEMO_MODE=true. Создаёт демо-пользователя.
export async function GET() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'demo mode disabled' }, { status: 403 })
  }
  const botToken = process.env.TG_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })
  }

  const user = {
    id: 777000001,
    first_name: 'Demo',
    last_name: '',
    username: 'demo_user',
    language_code: 'ru',
  }

  const params = new URLSearchParams()
  params.set('user', JSON.stringify(user))
  params.set('auth_date', String(Math.floor(Date.now() / 1000)))
  params.set('query_id', 'demo')

  // data_check_string: декодированные значения, ключи по алфавиту, без hash
  const dcs = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = crypto.createHmac('sha256', secret).update(dcs).digest('hex')
  params.set('hash', hash)

  return NextResponse.json({ initData: params.toString() })
}

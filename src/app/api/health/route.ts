import crypto from 'node:crypto'
import { NextResponse } from 'next/server'

// Диагностика деплоя. Открывается в браузере: https://<домен>/api/health
// Секреты не раскрывает — только факт наличия, длину и SHA-256-отпечаток
// (необратимый), чтобы сравнить токен в Vercel с настоящим.
export async function GET() {
  const token = process.env.TG_BOT_TOKEN ?? ''
  const fingerprint = token
    ? crypto.createHash('sha256').update(token).digest('hex').slice(0, 16)
    : null
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
    signatureFix: true,
    tg_token_set: token.length > 0,
    tg_token_length: token.length, // ожидается 46
    tg_token_fingerprint: fingerprint, // ожидается bae64689fdf0b569
    admin_password_set: Boolean(process.env.ADMIN_PASSWORD),
    database_url_set: Boolean(process.env.DATABASE_URL),
  })
}

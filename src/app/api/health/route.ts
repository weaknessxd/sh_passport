import { NextResponse } from 'next/server'

// Диагностика деплоя. Открывается в браузере: https://<домен>/api/health
// Секреты не раскрывает — только факт наличия и длину (чтобы поймать
// лишние пробелы/обрезку в env-переменных Vercel).
export async function GET() {
  const token = process.env.TG_BOT_TOKEN ?? ''
  return NextResponse.json({
    // какой коммит реально задеплоен (Vercel проставляет автоматически)
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
    // маркер: эта версия кода уже исключает signature из проверки
    signatureFix: true,
    tg_token_set: token.length > 0,
    tg_token_length: token.length, // ожидается 46
    admin_password_set: Boolean(process.env.ADMIN_PASSWORD),
    database_url_set: Boolean(process.env.DATABASE_URL),
  })
}

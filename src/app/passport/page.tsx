'use client'

import { useTMAUser } from '@/lib/telegram/sdk-provider'

export default function PassportPage() {
  const { user } = useTMAUser()

  const displayName = user?.display_name ?? user?.first_name ?? user?.tg_username ?? 'Участник'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-semibold">Привет, {displayName}</h1>
      <p className="mt-2 text-sm text-zinc-400">Паспорт Щёлочь — в разработке</p>
    </div>
  )
}

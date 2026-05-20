'use client'

import { useTMAUser } from '@/lib/telegram/sdk-provider'

export default function PassportPage() {
  const { user } = useTMAUser()

  const displayName =
    user?.display_name ??
    user?.first_name ??
    user?.tg_username ??
    'Участник'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-xs uppercase tracking-widest text-zinc-500">Паспорт Щёлочь</p>
      <h1 className="text-3xl font-semibold">{displayName}</h1>
      {user?.tg_username && (
        <p className="text-sm text-zinc-400">@{user.tg_username}</p>
      )}
      <p className="mt-4 text-xs text-zinc-600">MVP — интерфейс паспорта в разработке</p>
    </div>
  )
}

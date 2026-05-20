'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTMAUser } from '@/lib/telegram/sdk-provider'

export default function Home() {
  const { user, loading, error } = useTMAUser()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) return

    if (!user.onboarded) {
      router.replace('/onboarding')
    } else {
      router.replace('/passport')
    }
  }, [user, loading, router])

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <p className="text-xs text-zinc-500">Открой приложение через Telegram</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
    </div>
  )
}

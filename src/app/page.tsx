'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTMAUser } from '@/lib/telegram/sdk-provider'

export default function Home() {
  const { user, loading } = useTMAUser()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) return
    if (user.onboarded) {
      router.replace('/passport')
    } else {
      router.replace('/onboarding')
    }
  }, [user, loading, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
    </div>
  )
}

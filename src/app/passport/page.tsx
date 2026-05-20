'use client'

import { useEffect, useState } from 'react'
import { useTMAUser } from '@/lib/telegram/sdk-provider'
import { PassportViewer } from '@/components/passport/PassportViewer'

type StampData = {
  id: number
  name: string
  icon: string | null
  issued_at: string | null
}

export default function PassportPage() {
  const { user, initData } = useTMAUser()
  const [stamps, setStamps] = useState<StampData[]>([])

  useEffect(() => {
    if (!initData) return
    fetch('/api/user/stamps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    })
      .then((r) => r.json())
      .then((data: { stamps?: StampData[] }) => {
        if (data.stamps) setStamps(data.stamps)
      })
      .catch(() => { /* штампы не критичны */ })
  }, [initData])

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    )
  }

  return (
    <PassportViewer
      user={{
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        tg_username: user.tg_username,
        avatar_url: user.avatar_url,
        birth_date: user.birth_date,
      }}
      stamps={stamps}
    />
  )
}

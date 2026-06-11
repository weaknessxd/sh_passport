'use client'

import { useEffect, useState } from 'react'
import { useTMAUser } from '@/lib/telegram/sdk-provider'
import { PassportViewer } from '@/components/passport/PassportViewer'
import type { ThemeConfig } from '@/lib/passport/theme'

type StampData = {
  id: number
  name: string
  icon: string | null
  issued_at: string | null
}

type Profile = {
  id: number
  first_name: string | null
  last_name: string | null
  tg_username: string | null
  gender: string | null
  birth_date: string | null
  city: string | null
  region_issued: string | null
  theme: string | null
  avatar_url: string | null
  signature_svg: string | null
  skill_badges: string[]
  registered_at: string | null
}

export default function PassportPage() {
  const { user, initData } = useTMAUser()
  const [stamps, setStamps] = useState<StampData[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | undefined>(undefined)

  useEffect(() => {
    if (!initData) return

    // Full profile (theme, gender, signature, badges, …)
    const params = new URLSearchParams({ initData })
    fetch(`/api/user/update?${params.toString()}`)
      .then((r) => r.json())
      .then((res: { user?: Profile; theme_config?: ThemeConfig }) => {
        if (res.user) setProfile(res.user)
        if (res.theme_config) setThemeConfig(res.theme_config)
      })
      .catch(() => { /* fall back to TMA context */ })

    // Stamps
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
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    )
  }

  const data = profile ?? {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    tg_username: user.tg_username,
    gender: null,
    birth_date: user.birth_date,
    city: null,
    region_issued: null,
    theme: null,
    avatar_url: user.avatar_url,
    signature_svg: null,
    skill_badges: [],
    registered_at: null,
  }

  return (
    <PassportViewer
      user={{
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        tg_username: data.tg_username,
        gender: data.gender,
        birth_date: data.birth_date,
        city: data.city ?? data.region_issued,
        region_issued: data.region_issued,
        theme: data.theme,
        avatar_url: data.avatar_url,
        signature_svg: data.signature_svg,
        skill_badges: data.skill_badges,
        registered_at: data.registered_at,
      }}
      stamps={stamps}
      initData={initData}
      themeConfig={themeConfig}
    />
  )
}

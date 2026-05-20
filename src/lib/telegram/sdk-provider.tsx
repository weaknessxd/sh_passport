'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type TMAUser = {
  id: number
  tg_id: string
  tg_username: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url: string | null
  onboarded: boolean
}

type TMAContextValue = {
  user: TMAUser | null
  loading: boolean
  error: string | null
}

const TMAContext = createContext<TMAContextValue>({
  user: null,
  loading: true,
  error: null,
})

function getRawInitData(): string | null {
  if (typeof window === 'undefined') return null
  try {
    // window.Telegram.WebApp.initData — строка от Telegram
    const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram
    return tg?.WebApp?.initData ?? null
  } catch {
    return null
  }
}

export function TMAProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TMAUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function initTMA() {
      try {
        // Динамический импорт — SDK не должен запускаться на сервере
        const { init, retrieveLaunchParams } = await import('@telegram-apps/sdk-react')
        init()

        let initDataRaw: string | null = null
        try {
          const params = retrieveLaunchParams()
          initDataRaw = params.initDataRaw ? String(params.initDataRaw) : null
        } catch {
          // Не в Telegram — пробуем напрямую через window
          initDataRaw = getRawInitData()
        }

        if (!initDataRaw) {
          throw new Error('Открой приложение через Telegram')
        }

        const res = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: initDataRaw }),
        })

        if (!res.ok) {
          const body = await res.text()
          throw new Error(`Auth ${res.status}: ${body}`)
        }

        const data = (await res.json()) as { ok: boolean; user: TMAUser }
        setUser(data.user)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    void initTMA()
  }, [])

  return (
    <TMAContext.Provider value={{ user, loading, error }}>
      {children}
    </TMAContext.Provider>
  )
}

export function useTMAUser() {
  return useContext(TMAContext)
}

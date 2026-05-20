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
  has_password: boolean
}

type TMAContextValue = {
  user: TMAUser | null
  loading: boolean
  error: string | null
  initData: string | null
  setUser: (user: TMAUser) => void
}

const TMAContext = createContext<TMAContextValue>({
  user: null,
  loading: true,
  error: null,
  initData: null,
  setUser: () => {},
})

function getInitData(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram
    const initData = tg?.WebApp?.initData
    if (initData && initData.length > 0) return initData
  } catch { /* ignore */ }

  try {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const tgWebAppData = params.get('tgWebAppData')
    if (tgWebAppData && tgWebAppData.length > 0) return tgWebAppData
  } catch { /* ignore */ }

  return null
}

export function TMAProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TMAUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initData, setInitData] = useState<string | null>(null)

  useEffect(() => {
    async function initTMA() {
      try {
        const data = getInitData()

        if (!data) {
          throw new Error('Открой приложение через Telegram')
        }

        setInitData(data)

        const res = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: data }),
        })

        if (!res.ok) {
          const body = await res.text()
          throw new Error(`Auth ${res.status}: ${body}`)
        }

        const json = (await res.json()) as { ok: boolean; user: TMAUser }
        setUser(json.user)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    void initTMA()
  }, [])

  return (
    <TMAContext.Provider value={{ user, loading, error, initData, setUser }}>
      {children}
    </TMAContext.Provider>
  )
}

export function useTMAUser() {
  return useContext(TMAContext)
}

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

/**
 * Извлекаем initData из всех возможных источников:
 * 1. window.Telegram.WebApp.initData (telegram-web-app.js уже загружен)
 * 2. URL hash: #tgWebAppData=<url-encoded-init-data>
 */
function getInitData(): string | null {
  if (typeof window === 'undefined') return null

  // Способ 1 — через telegram-web-app.js
  try {
    const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram
    const initData = tg?.WebApp?.initData
    if (initData && initData.length > 0) return initData
  } catch { /* ignore */ }

  // Способ 2 — из URL hash (#tgWebAppData=...)
  try {
    const hash = window.location.hash.slice(1) // убираем #
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

  useEffect(() => {
    async function initTMA() {
      try {
        const initData = getInitData()

        if (!initData) {
          throw new Error('Открой приложение через Telegram')
        }

        const res = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
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

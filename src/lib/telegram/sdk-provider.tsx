'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { init, miniApp, retrieveLaunchParams } from '@telegram-apps/sdk-react'

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

export function TMAProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TMAUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function initTMA() {
      try {
        init()

        if (miniApp.isMounted()) {
          miniApp.mount()
        }

        const { initDataRaw } = retrieveLaunchParams()

        if (!initDataRaw) {
          throw new Error('No initDataRaw available')
        }

        const res = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: initDataRaw }),
        })

        if (!res.ok) {
          throw new Error(`Auth failed: ${res.status}`)
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

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTMAUser } from '@/lib/telegram/sdk-provider'

export default function UnlockPage() {
  const { initData, setUser } = useTMAUser()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim() || !initData) return

    setChecking(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, password: password.trim() }),
      })

      if (!res.ok) {
        const body = (await res.json()) as { error: string }
        throw new Error(body.error ?? `Ошибка ${res.status}`)
      }

      const data = (await res.json()) as { ok: boolean; user: Parameters<typeof setUser>[0] }
      if (data.user) setUser(data.user)

      router.replace('/passport')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
      setPassword('')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Паспорт Щёлочь</p>
      <h1 className="mb-8 text-2xl font-semibold">Введи пароль</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          autoComplete="current-password"
          autoFocus
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-white outline-none focus:border-zinc-400"
        />

        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={checking || !password.trim()}
          className="w-full rounded-lg bg-white py-3 font-semibold text-black disabled:opacity-40"
        >
          {checking ? 'Проверяем...' : 'Войти'}
        </button>
      </form>
    </div>
  )
}

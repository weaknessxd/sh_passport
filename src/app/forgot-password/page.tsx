'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTMAUser } from '@/lib/telegram/sdk-provider'

export default function ForgotPasswordPage() {
  const { initData, setUser } = useTMAUser()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim() || !initData) return

    if (password !== confirm) {
      setError('Пароли не совпадают')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/user/update', {
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
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Паспорт Щёлочь</p>
      <h1 className="mb-2 text-2xl font-semibold">Новый пароль</h1>
      <p className="mb-8 text-sm text-zinc-400 text-center">
        Ты авторизован через Telegram — установи новый пароль
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Новый пароль"
          autoComplete="new-password"
          autoFocus
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-400"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Повтори пароль"
          autoComplete="new-password"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-400"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving || password.length < 4 || !confirm}
          className="w-full rounded-lg bg-white py-3 font-semibold text-black disabled:opacity-40"
        >
          {saving ? 'Сохраняем...' : 'Сохранить пароль'}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="w-full py-2 text-sm text-zinc-500"
        >
          Назад
        </button>
      </form>
    </div>
  )
}

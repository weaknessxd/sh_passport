'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTMAUser } from '@/lib/telegram/sdk-provider'

export default function OnboardingPage() {
  const { user, initData, setUser } = useTMAUser()
  const router = useRouter()
  const [name, setName] = useState(user?.first_name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !initData) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, first_name: name.trim() }),
      })

      if (!res.ok) {
        const body = (await res.json()) as { error: string }
        throw new Error(body.error ?? `Ошибка ${res.status}`)
      }

      const data = (await res.json()) as { ok: boolean; user: typeof user }
      if (data.user) setUser(data.user)

      router.replace('/passport')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Что-то пошло не так')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="mb-2 text-2xl font-semibold">Добро пожаловать</h1>
      <p className="mb-8 text-sm text-zinc-400">Давай оформим твой паспорт</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-400" htmlFor="name">
            Как тебя зовут?
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя"
            autoComplete="off"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-400"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full rounded-lg bg-white py-3 font-semibold text-black transition-opacity disabled:opacity-40"
        >
          {saving ? 'Сохраняем...' : 'Получить паспорт →'}
        </button>
      </form>
    </div>
  )
}

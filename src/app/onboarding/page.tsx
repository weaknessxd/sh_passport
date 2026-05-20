'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTMAUser } from '@/lib/telegram/sdk-provider'

type Step = 'email' | 'name'

export default function OnboardingPage() {
  const { initData, setUser } = useTMAUser()
  const router = useRouter()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(fields: Record<string, string>) {
    if (!initData) return
    const res = await fetch('/api/user/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, ...fields }),
    })
    if (!res.ok) {
      const body = (await res.json()) as { error: string }
      throw new Error(typeof body.error === 'string' ? body.error : `Ошибка ${res.status}`)
    }
    const data = (await res.json()) as { ok: boolean; user: Parameters<typeof setUser>[0] }
    if (data.user) setUser(data.user)
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSaving(true)
    setError(null)
    try {
      await save({ email: email.trim() })
      setStep('name')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  async function handleName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await save({ first_name: name.trim() })
      router.replace('/passport')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* Прогресс */}
      <div className="mb-8 flex gap-2">
        {(['email', 'name'] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1 w-8 rounded-full transition-colors ${
              i <= (['email', 'name'] as Step[]).indexOf(step) ? 'bg-white' : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {step === 'email' && (
        <form onSubmit={handleEmail} className="w-full max-w-sm space-y-4">
          <div>
            <h1 className="mb-1 text-2xl font-semibold">Добро пожаловать</h1>
            <p className="mb-6 text-sm text-zinc-400">Введи email — он нужен для получения штампов</p>
            <label className="mb-1 block text-sm text-zinc-400" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-400"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={saving || !email.trim()}
            className="w-full rounded-lg bg-white py-3 font-semibold text-black disabled:opacity-40"
          >
            {saving ? 'Сохраняем...' : 'Далее →'}
          </button>
        </form>
      )}

      {step === 'name' && (
        <form onSubmit={handleName} className="w-full max-w-sm space-y-4">
          <div>
            <h1 className="mb-1 text-2xl font-semibold">Как тебя зовут?</h1>
            <p className="mb-6 text-sm text-zinc-400">Имя будет отображаться в паспорте</p>
            <label className="mb-1 block text-sm text-zinc-400" htmlFor="name">Имя</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя"
              autoComplete="given-name"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-400"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full rounded-lg bg-white py-3 font-semibold text-black disabled:opacity-40"
          >
            {saving ? 'Сохраняем...' : 'Готово →'}
          </button>
        </form>
      )}
    </div>
  )
}

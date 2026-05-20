'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTMAUser } from '@/lib/telegram/sdk-provider'

export default function OnboardingPage() {
  const { user } = useTMAUser()
  const router = useRouter()
  const [name, setName] = useState(user?.first_name ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      // TODO: Server Action для сохранения имени
      await new Promise((r) => setTimeout(r, 300))
      router.replace('/passport')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="mb-8 text-2xl font-semibold">Добро пожаловать</h1>
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
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-500"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full rounded-lg bg-white py-3 font-semibold text-black transition-opacity disabled:opacity-50"
        >
          {saving ? 'Сохраняем...' : 'Получить паспорт'}
        </button>
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTMAUser } from '@/lib/telegram/sdk-provider'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; stampName: string }
  | { status: 'error'; message: string }

export default function StampsClaimPage() {
  const { initData } = useTMAUser()
  const router = useRouter()

  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orderId.trim() || !email.trim() || !initData) return

    setState({ status: 'loading' })

    try {
      const res = await fetch('/api/stamps/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData,
          order_id: orderId.trim(),
          email: email.trim(),
        }),
      })

      const data = (await res.json()) as
        | { ok: true; stamp: { name: string } }
        | { error: string }

      if (!res.ok || !('ok' in data)) {
        setState({ status: 'error', message: 'error' in data ? data.error : `Ошибка ${res.status}` })
        return
      }

      setState({ status: 'success', stampName: data.stamp.name })
    } catch {
      setState({ status: 'error', message: 'Нет соединения. Попробуй ещё раз.' })
    }
  }

  if (state.status === 'success') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#e94560] text-5xl">
          ★
        </div>
        <h1 className="mb-2 text-2xl font-semibold">Штамп получен!</h1>
        <p className="mb-8 text-sm text-zinc-400">{state.stampName}</p>
        <button
          onClick={() => router.replace('/passport')}
          className="w-full max-w-sm rounded-lg bg-white py-3 font-semibold text-black"
        >
          Открыть паспорт
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col px-6 pt-12">
      {/* Шапка */}
      <div className="mb-8">
        <Link href="/passport" className="mb-4 inline-block text-sm text-zinc-500">
          ← Паспорт
        </Link>
        <h1 className="text-2xl font-semibold">Получить штамп</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Введи номер заказа и email, указанный при покупке
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-400" htmlFor="order_id">
            Номер заказа
          </label>
          <input
            id="order_id"
            type="text"
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value)
              setState({ status: 'idle' })
            }}
            placeholder="Например: 12345"
            autoComplete="off"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400" htmlFor="email">
            Email из заказа
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setState({ status: 'idle' })
            }}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-400"
          />
        </div>

        {state.status === 'error' && (
          <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3">
            <p className="text-sm text-red-400">{state.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={state.status === 'loading' || !orderId.trim() || !email.trim()}
          className="w-full rounded-lg bg-white py-3 font-semibold text-black disabled:opacity-40"
        >
          {state.status === 'loading' ? 'Проверяем...' : 'Получить штамп'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-zinc-600">
        Штамп выдаётся один раз на заказ.
        <br />
        Для курсов — только после прохождения.
      </p>
    </div>
  )
}

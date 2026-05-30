'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTMAUser } from '@/lib/telegram/sdk-provider'
import { Button } from '@/components/ui/Button'
import { InputField } from '@/components/ui/InputField'

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

  async function handleSubmit() {
    if (!orderId.trim() || !email.trim() || !initData) return
    setState({ status: 'loading' })

    try {
      const res = await fetch('/api/stamps/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, order_id: orderId.trim(), email: email.trim() }),
      })
      const data = (await res.json()) as { ok: true; stamp: { name: string } } | { error: string }

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
      <div style={wrap}>
        <div
          style={{
            width: '96px', height: '96px', borderRadius: '999px',
            border: '2px solid #ffffff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '44px', marginBottom: '24px',
          }}
        >
          ★
        </div>
        <h1 style={heading}>Штамп получен!</h1>
        <p style={{ ...sub, marginBottom: '32px' }}>{state.stampName}</p>
        <Button onClick={() => router.replace('/passport')}>Открыть паспорт</Button>
      </div>
    )
  }

  return (
    <div style={{ ...wrap, justifyContent: 'flex-start', paddingTop: '80px' }}>
      <button onClick={() => router.replace('/passport')} style={backLink}>← Паспорт</button>
      <h1 style={{ ...heading, marginTop: '24px' }}>Получить штамп</h1>
      <p style={{ ...sub, marginBottom: '40px', textAlign: 'center' }}>
        Введи номер заказа и email, указанный при покупке
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
        <InputField
          placeholder="Номер заказа"
          value={orderId}
          onChange={(v) => { setOrderId(v); setState({ status: 'idle' }) }}
        />
        <InputField
          placeholder="Email из заказа"
          value={email}
          onChange={(v) => { setEmail(v); setState({ status: 'idle' }) }}
          type="email"
          error={state.status === 'error' ? state.message : undefined}
        />
      </div>

      <div style={{ marginTop: '40px' }}>
        <Button
          onClick={handleSubmit}
          disabled={state.status === 'loading' || !orderId.trim() || !email.trim()}
        >
          {state.status === 'loading' ? 'Проверяем...' : 'Получить штамп'}
        </Button>
      </div>

      <p style={{ ...sub, marginTop: '24px', fontSize: '12px', textAlign: 'center' }}>
        Штамп выдаётся один раз на заказ.<br />Для курсов — только после прохождения.
      </p>
    </div>
  )
}

const wrap: React.CSSProperties = {
  minHeight: '100vh',
  background: '#000000',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 24px',
  fontFamily: 'var(--font-inter), sans-serif',
}

const heading: React.CSSProperties = {
  fontFamily: 'var(--font-inter), sans-serif',
  fontWeight: 800,
  fontSize: '28px',
  letterSpacing: '-0.04em',
  color: '#ffffff',
  marginBottom: '8px',
}

const sub: React.CSSProperties = {
  fontFamily: 'var(--font-inter), sans-serif',
  fontWeight: 500,
  fontSize: '14px',
  color: '#8a8a8a',
}

const backLink: React.CSSProperties = {
  alignSelf: 'flex-start',
  background: 'transparent',
  border: 'none',
  color: '#8a8a8a',
  fontFamily: 'var(--font-inter), sans-serif',
  fontSize: '14px',
  cursor: 'pointer',
  padding: 0,
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ThemeConfig } from '@/lib/passport/theme'
import { DEFAULT_THEME } from '@/lib/passport/theme'

type ThemeRow = {
  id: number
  name: string
  series_code: string
  config: Partial<ThemeConfig> | null
  is_default: boolean | null
  created_at: string | null
}

type OrderRow = {
  id: string
  email: string
  status: string
  product_type: string | null
  course_passed: boolean | null
  created_at: string | null
}

const S = {
  page: { minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'var(--font-inter), sans-serif', padding: '24px 16px 80px' } as React.CSSProperties,
  h1: { fontSize: '22px', fontWeight: 800, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.03em', marginBottom: '20px' },
  card: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '16px', marginBottom: '14px' } as React.CSSProperties,
  input: { width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', padding: '10px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  label: { display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px', marginTop: '10px' } as React.CSSProperties,
  btn: { background: '#fff', color: '#000', border: 'none', borderRadius: '100px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
  btnGhost: { background: 'transparent', color: '#fff', border: '1px solid #444', borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
  tag: { fontSize: '11px', fontWeight: 700, background: '#1f4d2e', color: '#7be09b', borderRadius: '100px', padding: '3px 10px' } as React.CSSProperties,
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [tab, setTab] = useState<'themes' | 'orders'>('themes')

  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      const res = await fetch(path, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': sessionStorage.getItem('admin_pw') ?? '',
          ...(init?.headers ?? {}),
        },
      })
      return res
    },
    [],
  )

  // Автовход, если пароль в сессии
  useEffect(() => {
    if (sessionStorage.getItem('admin_pw')) {
      void (async () => {
        const res = await api('/api/admin/themes')
        if (res.ok) setAuthed(true)
        else sessionStorage.removeItem('admin_pw')
      })()
    }
  }, [api])

  async function login() {
    sessionStorage.setItem('admin_pw', password)
    const res = await api('/api/admin/themes')
    if (res.ok) {
      setAuthed(true)
      setAuthError('')
    } else {
      sessionStorage.removeItem('admin_pw')
      setAuthError('Неверный пароль')
    }
  }

  if (!authed) {
    return (
      <div style={{ ...S.page, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '320px' }}>
          <h1 style={S.h1}>Щёлочь · Админ</h1>
          <input
            style={S.input}
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void login()}
          />
          {authError && <p style={{ color: '#ff6b6b', fontSize: '13px', marginTop: '8px' }}>{authError}</p>}
          <button style={{ ...S.btn, width: '100%', marginTop: '14px' }} onClick={() => void login()}>
            Войти
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Щёлочь · Админ</h1>

      {/* Табы */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {([['themes', 'Темы'], ['orders', 'Заказы InSales']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              ...S.btnGhost,
              background: tab === key ? '#fff' : 'transparent',
              color: tab === key ? '#000' : '#fff',
              borderColor: tab === key ? '#fff' : '#444',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'themes' ? <ThemesTab api={api} /> : <OrdersTab api={api} />}
    </div>
  )
}

// ═══════════════ ТЕМЫ ═══════════════

function ThemesTab({ api }: { api: (p: string, i?: RequestInit) => Promise<Response> }) {
  const [themes, setThemes] = useState<ThemeRow[]>([])
  const [editing, setEditing] = useState<ThemeRow | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const res = await api('/api/admin/themes')
    if (res.ok) {
      const data = (await res.json()) as { themes: ThemeRow[] }
      setThemes(data.themes)
    }
  }, [api])

  useEffect(() => { void load() }, [load])

  async function makeDefault(id: number) {
    setBusy(true)
    await api('/api/admin/themes', { method: 'PATCH', body: JSON.stringify({ id, make_default: true }) })
    await load()
    setBusy(false)
  }

  return (
    <div>
      {msg && <p style={{ color: '#7be09b', fontSize: '13px', marginBottom: '10px' }}>{msg}</p>}

      {themes.length === 0 && (
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '14px' }}>
          Тем пока нет — создай первую. Пока темы не назначены, паспорта используют встроенный дефолт.
        </p>
      )}

      {themes.map((t) => {
        const cfg = { ...DEFAULT_THEME, ...(t.config ?? {}), colors: { ...DEFAULT_THEME.colors, ...(t.config?.colors ?? {}) } }
        return (
          <div key={t.id} style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '16px' }}>{t.name}</strong>
              <span style={{ color: '#888', fontSize: '12px' }}>{t.series_code}</span>
              {t.is_default && <span style={S.tag}>активная для новых</span>}
            </div>
            {/* Свотчи */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              {Object.values(cfg.colors).map((c, i) => (
                <div key={i} style={{ width: '22px', height: '22px', borderRadius: '6px', background: c, border: '1px solid #333' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {!t.is_default && (
                <button style={S.btnGhost} disabled={busy} onClick={() => void makeDefault(t.id)}>
                  Сделать активной
                </button>
              )}
              <button style={S.btnGhost} onClick={() => setEditing(t)}>Редактировать</button>
            </div>
          </div>
        )
      })}

      <button style={{ ...S.btn, marginTop: '6px' }} onClick={() => setEditing('new')}>
        + Новая тема
      </button>

      {editing && (
        <ThemeForm
          api={api}
          theme={editing === 'new' ? null : editing}
          onDone={(saved) => {
            setEditing(null)
            if (saved) { setMsg('Сохранено'); setTimeout(() => setMsg(''), 2000) }
            void load()
          }}
        />
      )}
    </div>
  )
}

function ThemeForm({
  api, theme, onDone,
}: {
  api: (p: string, i?: RequestInit) => Promise<Response>
  theme: ThemeRow | null
  onDone: (saved: boolean) => void
}) {
  const base = {
    ...DEFAULT_THEME,
    ...(theme?.config ?? {}),
    colors: { ...DEFAULT_THEME.colors, ...(theme?.config?.colors ?? {}) },
  }
  const [name, setName] = useState(theme?.name ?? '')
  const [series, setSeries] = useState(theme?.series_code ?? 'TM26')
  const [cfg, setCfg] = useState(base)
  const [makeDefault, setMakeDefault] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function setColor(key: keyof ThemeConfig['colors']) {
    return (v: string) => setCfg((p) => ({ ...p, colors: { ...p.colors, [key]: v } }))
  }
  function setField(key: 'watermark_main' | 'watermark_stamps' | 'issuer' | 'issue_date' | 'mrz_prefix') {
    return (v: string) => setCfg((p) => ({ ...p, [key]: v }))
  }

  async function save() {
    if (!name.trim()) { setError('Укажи название'); return }
    setBusy(true)
    setError('')
    const body = theme
      ? { id: theme.id, name: name.trim(), series_code: series.trim(), config: cfg, make_default: makeDefault || undefined }
      : { name: name.trim(), series_code: series.trim(), config: cfg, make_default: makeDefault }
    const res = await api('/api/admin/themes', {
      method: theme ? 'PATCH' : 'POST',
      body: JSON.stringify(body),
    })
    setBusy(false)
    if (res.ok) onDone(true)
    else {
      const data = (await res.json().catch(() => null)) as { error?: unknown } | null
      setError(typeof data?.error === 'string' ? data.error : 'Ошибка сохранения')
    }
  }

  const colorFields: [keyof ThemeConfig['colors'], string][] = [
    ['card_bg', 'Фон карточки'],
    ['accent', 'Акцент (номер)'],
    ['text', 'Текст'],
    ['label', 'Подписи полей'],
    ['border', 'Рамки/линии'],
    ['badge_bg', 'Фон бейджей'],
  ]

  return (
    <div style={{ ...S.card, marginTop: '16px', borderColor: '#555' }}>
      <strong style={{ fontSize: '15px' }}>{theme ? `Редактирование: ${theme.name}` : 'Новая тема'}</strong>

      <label style={S.label}>Название (метка «тема» на карточке)</label>
      <input style={S.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Цифровой эскапизм" />

      <label style={S.label}>Код серии (префикс MRZ-зоны паспорта)</label>
      <input style={S.input} value={series} onChange={(e) => setSeries(e.target.value)} placeholder="TM26" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
        {colorFields.map(([key, label]) => (
          <div key={key}>
            <label style={S.label}>{label}</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="color"
                value={cfg.colors[key]}
                onChange={(e) => setColor(key)(e.target.value)}
                style={{ width: '38px', height: '38px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
              />
              <input style={S.input} value={cfg.colors[key]} onChange={(e) => setColor(key)(e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      <label style={S.label}>Водяной знак — главная (URL/путь к SVG)</label>
      <input style={S.input} value={cfg.watermark_main} onChange={(e) => setField('watermark_main')(e.target.value)} />

      <label style={S.label}>Водяной знак — штампы</label>
      <input style={S.input} value={cfg.watermark_stamps} onChange={(e) => setField('watermark_stamps')(e.target.value)} />

      <label style={S.label}>Текст «выдан»</label>
      <input style={S.input} value={cfg.issuer} onChange={(e) => setField('issuer')(e.target.value)} />

      <label style={S.label}>Дата выдачи</label>
      <input style={S.input} value={cfg.issue_date} onChange={(e) => setField('issue_date')(e.target.value)} />

      <label style={S.label}>Префикс MRZ</label>
      <input style={S.input} value={cfg.mrz_prefix} onChange={(e) => setField('mrz_prefix')(e.target.value)} />

      <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '13px', color: '#fff' }}>
        <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} />
        Сделать активной для новых пользователей
      </label>

      {error && <p style={{ color: '#ff6b6b', fontSize: '13px', marginTop: '8px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        <button style={S.btn} disabled={busy} onClick={() => void save()}>
          {busy ? 'Сохраняем…' : 'Сохранить'}
        </button>
        <button style={S.btnGhost} onClick={() => onDone(false)}>Отмена</button>
      </div>
    </div>
  )
}

// ═══════════════ ЗАКАЗЫ ═══════════════

function OrdersTab({ api }: { api: (p: string, i?: RequestInit) => Promise<Response> }) {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [csv, setCsv] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')

  const load = useCallback(async () => {
    const res = await api('/api/admin/orders')
    if (res.ok) {
      const data = (await res.json()) as { orders: OrderRow[] }
      setOrders(data.orders)
    }
  }, [api])

  useEffect(() => { void load() }, [load])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCsv(reader.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }

  async function runImport() {
    if (!csv.trim()) return
    setBusy(true)
    setResult('')
    const res = await api('/api/admin/orders', { method: 'POST', body: JSON.stringify({ csv }) })
    const data = (await res.json().catch(() => null)) as
      | { ok?: boolean; processed?: number; skipped?: number; error?: string }
      | null
    setBusy(false)
    if (res.ok && data?.ok) {
      setResult(`Импортировано: ${data.processed}, пропущено: ${data.skipped}`)
      setCsv('')
      void load()
    } else {
      setResult(`Ошибка: ${data?.error ?? res.status}`)
    }
  }

  async function toggleCourse(o: OrderRow) {
    await api('/api/admin/orders', {
      method: 'PATCH',
      body: JSON.stringify({ id: o.id, course_passed: !o.course_passed }),
    })
    void load()
  }

  return (
    <div>
      {/* Импорт */}
      <div style={S.card}>
        <strong style={{ fontSize: '15px' }}>Импорт CSV</strong>
        <p style={{ color: '#888', fontSize: '12px', margin: '6px 0 10px' }}>
          Колонки: id, email, status, product_type, created_at. Upsert по id; course_passed не перетирается.
        </p>
        <input type="file" accept=".csv,text/csv" onChange={handleFile} style={{ fontSize: '13px', marginBottom: '10px' }} />
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={'или вставь CSV сюда\nid,email,status,product_type,created_at\n1001,user@mail.ru,paid,course,2026-06-01'}
          rows={5}
          style={{ ...S.input, resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
          <button style={S.btn} disabled={busy || !csv.trim()} onClick={() => void runImport()}>
            {busy ? 'Импортируем…' : 'Импортировать'}
          </button>
          {result && <span style={{ fontSize: '13px', color: result.startsWith('Ошибка') ? '#ff6b6b' : '#7be09b' }}>{result}</span>}
        </div>
      </div>

      {/* Список заказов */}
      <div style={{ ...S.card, overflowX: 'auto' }}>
        <strong style={{ fontSize: '15px' }}>Заказы ({orders.length})</strong>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '12px' }}>
          <thead>
            <tr style={{ color: '#888', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>ID</th>
              <th style={{ padding: '6px 8px' }}>Email</th>
              <th style={{ padding: '6px 8px' }}>Статус</th>
              <th style={{ padding: '6px 8px' }}>Тип</th>
              <th style={{ padding: '6px 8px' }}>Курс пройден</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderTop: '1px solid #222' }}>
                <td style={{ padding: '6px 8px', fontFamily: 'ui-monospace, monospace' }}>{o.id}</td>
                <td style={{ padding: '6px 8px' }}>{o.email}</td>
                <td style={{ padding: '6px 8px' }}>{o.status}</td>
                <td style={{ padding: '6px 8px' }}>{o.product_type ?? '—'}</td>
                <td style={{ padding: '6px 8px' }}>
                  <button
                    onClick={() => void toggleCourse(o)}
                    style={{
                      ...S.btnGhost,
                      padding: '4px 12px',
                      fontSize: '12px',
                      background: o.course_passed ? '#1f4d2e' : 'transparent',
                      color: o.course_passed ? '#7be09b' : '#888',
                      borderColor: o.course_passed ? '#1f4d2e' : '#444',
                    }}
                  >
                    {o.course_passed ? 'Да' : 'Нет'}
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={5} style={{ padding: '12px 8px', color: '#666' }}>Заказов нет</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

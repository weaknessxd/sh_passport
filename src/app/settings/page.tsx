'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTMAUser } from '@/lib/telegram/sdk-provider'

type ProfileData = {
  first_name: string
  last_name: string
  display_name: string
  email: string
  birth_date: string
  region_issued: string
  signature_text: string
  about_owner: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function Field({
  label,
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
  maxLength,
  hint,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  maxLength?: number
  hint?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-zinc-400" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-400"
      />
      {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
    </div>
  )
}

function TextArea({
  label,
  id,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-zinc-400" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-400"
      />
      {maxLength && (
        <p className="mt-1 text-right text-xs text-zinc-600">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { user, initData, setUser } = useTMAUser()
  const router = useRouter()

  const [data, setData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    display_name: '',
    email: '',
    birth_date: '',
    region_issued: '',
    signature_text: '',
    about_owner: '',
  })
  const [loaded, setLoaded] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Загружаем актуальные данные с сервера
  useEffect(() => {
    if (!initData) return
    const params = new URLSearchParams({ initData })
    fetch(`/api/user/update?${params.toString()}`)
      .then((r) => r.json())
      .then((res: { user?: Partial<ProfileData> }) => {
        if (res.user) {
          setData({
            first_name: res.user.first_name ?? '',
            last_name: res.user.last_name ?? '',
            display_name: res.user.display_name ?? '',
            email: res.user.email ?? '',
            birth_date: res.user.birth_date ?? '',
            region_issued: res.user.region_issued ?? '',
            signature_text: res.user.signature_text ?? '',
            about_owner: res.user.about_owner ?? '',
          })
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [initData])

  function set(field: keyof ProfileData) {
    return (value: string) => setData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!initData) return

    setSaveState('saving')
    setErrorMsg('')

    // Отправляем только непустые изменения
    const payload: Record<string, string> = { initData }
    if (data.first_name.trim()) payload['first_name'] = data.first_name.trim()
    if (data.last_name !== undefined) payload['last_name'] = data.last_name.trim()
    if (data.display_name !== undefined) payload['display_name'] = data.display_name.trim()
    if (data.email.trim()) payload['email'] = data.email.trim()
    if (data.birth_date) payload['birth_date'] = data.birth_date
    if (data.region_issued !== undefined) payload['region_issued'] = data.region_issued.trim()
    if (data.signature_text !== undefined) payload['signature_text'] = data.signature_text.trim()
    if (data.about_owner !== undefined) payload['about_owner'] = data.about_owner.trim()

    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = (await res.json()) as { ok?: boolean; user?: typeof user; error?: string }

      if (!res.ok) {
        throw new Error(json.error ?? `Ошибка ${res.status}`)
      }

      if (json.user) setUser(json.user)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Не удалось сохранить')
      setSaveState('error')
    }
  }

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Шапка */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-800 bg-black px-4 py-3">
        <Link href="/passport" className="text-zinc-400 text-lg leading-none">←</Link>
        <h1 className="text-base font-semibold">Настройки паспорта</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6 px-4 pt-6">

        {/* Блок: Отображение */}
        <section>
          <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Отображение</p>
          <div className="space-y-3">
            <Field
              label="Имя в паспорте"
              id="display_name"
              value={data.display_name}
              onChange={set('display_name')}
              placeholder="Как тебя отображать (можно псевдоним)"
              maxLength={64}
              hint="Если пусто — используется имя"
            />
            <Field
              label="Имя"
              id="first_name"
              value={data.first_name}
              onChange={set('first_name')}
              placeholder="Имя"
              maxLength={64}
            />
            <Field
              label="Фамилия"
              id="last_name"
              value={data.last_name}
              onChange={set('last_name')}
              placeholder="Фамилия"
              maxLength={64}
            />
          </div>
        </section>

        {/* Блок: Данные */}
        <section>
          <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Данные</p>
          <div className="space-y-3">
            <Field
              label="Email"
              id="email"
              value={data.email}
              onChange={set('email')}
              type="email"
              placeholder="you@example.com"
              hint="Используется для получения штампов"
            />
            <Field
              label="Дата рождения"
              id="birth_date"
              value={data.birth_date}
              onChange={set('birth_date')}
              type="date"
            />
            <Field
              label="Регион"
              id="region_issued"
              value={data.region_issued}
              onChange={set('region_issued')}
              placeholder="Москва"
              maxLength={64}
            />
          </div>
        </section>

        {/* Блок: О себе */}
        <section>
          <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">О себе</p>
          <div className="space-y-3">
            <TextArea
              label="Подпись"
              id="signature_text"
              value={data.signature_text}
              onChange={set('signature_text')}
              placeholder="Короткая подпись в паспорте"
              maxLength={128}
            />
            <TextArea
              label="О владельце"
              id="about_owner"
              value={data.about_owner}
              onChange={set('about_owner')}
              placeholder="Расскажи немного о себе"
              maxLength={256}
            />
          </div>
        </section>

        {/* Пароль */}
        <section>
          <p className="mb-1 text-xs uppercase tracking-widest text-zinc-500">Безопасность</p>
          <p className="mb-3 text-xs text-zinc-600">Смена пароля — на странице входа</p>
          <Link
            href="/forgot-password"
            className="block rounded-lg border border-zinc-700 px-4 py-3 text-sm text-zinc-400"
          >
            Изменить пароль →
          </Link>
        </section>

        {/* Ошибка */}
        {saveState === 'error' && (
          <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3">
            <p className="text-sm text-red-400">{errorMsg}</p>
          </div>
        )}
      </form>

      {/* Плавающая кнопка сохранения */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-black px-4 py-3">
        <button
          type="submit"
          form="settings-form"
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className="w-full rounded-lg bg-white py-3 font-semibold text-black disabled:opacity-40"
        >
          {saveState === 'saving' && 'Сохраняем...'}
          {saveState === 'saved' && '✓ Сохранено'}
          {(saveState === 'idle' || saveState === 'error') && 'Сохранить'}
        </button>
      </div>
    </div>
  )
}

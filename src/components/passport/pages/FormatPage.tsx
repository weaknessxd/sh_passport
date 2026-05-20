type StampRecord = {
  id: number
  name: string
  icon?: string | null
  issued_at?: string | null
}

type Props = {
  /** 0 = reminders page, 1 = history page */
  variant: 'reminders' | 'history'
  stamps?: StampRecord[]
}

// ─── Reminders ───────────────────────────────────────────────────────────────

const REMINDERS = [
  {
    icon: '★',
    title: 'Штамп — раз и навсегда',
    body: 'Штамп выдаётся один раз на заказ и не может быть передан другому.',
  },
  {
    icon: '✉',
    title: 'Email привязан к штампу',
    body: 'При получении штампа используй тот же email, что был при покупке.',
  },
  {
    icon: '⚽',
    title: 'Курс — только после прохождения',
    body: 'Для курсов штамп станет доступен после 100% прогресса обучения.',
  },
  {
    icon: '↻',
    title: 'Паспорт можно обновить',
    body: 'Настройки профиля и подпись изменяются в любой момент.',
  },
]

function RemindersPage() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#080810]">
      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Header */}
      <div className="relative flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          Напоминания
        </span>
        <div className="ml-auto h-px flex-1 bg-zinc-800" />
        <span className="font-mono text-[10px] text-zinc-700">14</span>
      </div>

      {/* Items */}
      <div className="relative space-y-0 divide-y divide-zinc-800/60 px-4">
        {REMINDERS.map((r) => (
          <div key={r.title} className="flex gap-3 py-3">
            <span className="mt-0.5 text-base text-[#e94560]">{r.icon}</span>
            <div>
              <p className="text-xs font-semibold text-zinc-200">{r.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{r.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute bottom-3 left-0 right-0 px-4">
        <p className="text-center text-[9px] uppercase tracking-widest text-zinc-700">
          Паспорт Щёлочь · Серия FB25
        </p>
      </div>
    </div>
  )
}

// ─── History ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function HistoryPage({ stamps = [] }: { stamps?: StampRecord[] }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#080810]">
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Header */}
      <div className="relative flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          История штампов
        </span>
        <div className="ml-auto h-px flex-1 bg-zinc-800" />
        <span className="font-mono text-[10px] text-zinc-700">15</span>
      </div>

      {/* Content */}
      <div className="relative overflow-auto px-4" style={{ maxHeight: 'calc(100% - 80px)' }}>
        {stamps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl">○</p>
            <p className="mt-3 text-xs text-zinc-600">Штампов пока нет</p>
            <p className="mt-1 text-[11px] text-zinc-700">
              Получи первый штамп за покупку или курс
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {stamps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 py-3">
                {/* Index */}
                <span className="font-mono text-[11px] text-zinc-700">
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Icon or placeholder */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e94560]/40 text-base">
                  {s.icon ?? '★'}
                </div>

                {/* Name + date */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-zinc-200">{s.name}</p>
                  <p className="text-[10px] text-zinc-600">{formatDate(s.issued_at)}</p>
                </div>

                {/* Checkmark */}
                <span className="text-xs text-[#e94560]">✓</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-3 left-0 right-0 px-4">
        <p className="text-center text-[9px] uppercase tracking-widest text-zinc-700">
          Паспорт Щёлочь · Серия FB25
        </p>
      </div>
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function FormatPage({ variant, stamps }: Props) {
  if (variant === 'history') {
    return <HistoryPage stamps={stamps} />
  }
  return <RemindersPage />
}

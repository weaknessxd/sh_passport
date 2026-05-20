type Props = {
  current: number   // 0-based
  total: number
  onPrev: () => void
  onNext: () => void
}

export function PageNavigator({ current, total, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button
        onClick={onPrev}
        disabled={current === 0}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-colors disabled:opacity-20 active:bg-zinc-800"
        aria-label="Предыдущая страница"
      >
        ‹
      </button>

      {/* Точки-индикатор (показываем до 16 точек) */}
      <div className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all ${
              i === current
                ? 'h-2 w-4 bg-[#e94560]'
                : 'h-1.5 w-1.5 bg-zinc-700'
            }`}
          />
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={current === total - 1}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-colors disabled:opacity-20 active:bg-zinc-800"
        aria-label="Следующая страница"
      >
        ›
      </button>
    </div>
  )
}

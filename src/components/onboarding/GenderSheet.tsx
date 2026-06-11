'use client'

import { haptic } from '@/lib/telegram/haptics'

const OPTIONS: { value: string; muted?: boolean }[] = [
  { value: 'Мужской' },
  { value: 'Женский' },
  { value: 'Секрет', muted: true },
]

export function GenderSheet({
  open,
  onSelect,
  onClose,
}: {
  open: boolean
  onSelect: (v: string) => void
  onClose: () => void
}) {
  return (
    <>
      {/* Оверлей */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 200,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s',
        }}
      />
      {/* Шторка */}
      <div
        style={{
          position: 'fixed',
          bottom: open ? 0 : '-100%',
          left: 0,
          width: '100%',
          background: '#1c1c1d',
          borderRadius: '20px 20px 0 0',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          padding: '10px 20px max(30px, env(safe-area-inset-bottom))',
          boxSizing: 'border-box',
          transition: 'bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {OPTIONS.map((opt, i) => (
          <button
            key={opt.value}
            onClick={() => { haptic('light'); onSelect(opt.value) }}
            style={{
              width: '100%',
              padding: '20px 0',
              textAlign: 'center',
              fontFamily: 'var(--font-inter), sans-serif',
              fontSize: '18px',
              fontWeight: 500,
              color: opt.muted ? '#747373' : '#ffffff',
              background: 'transparent',
              border: 'none',
              borderBottom: i < OPTIONS.length - 1 ? '1px solid #333333' : 'none',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {opt.value}
          </button>
        ))}
      </div>
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { haptic } from '@/lib/telegram/haptics'

/**
 * Модалка подтверждения пересоздания фото (из прототипа):
 * блюр-фон, «ДА» заблокирована 3 секунды с анимированной обводкой по периметру.
 */
export function WarningModal({
  open,
  attemptsLeft,
  onConfirm,
  onClose,
}: {
  open: boolean
  attemptsLeft: number
  onConfirm: () => void
  onClose: () => void
}) {
  const [yesEnabled, setYesEnabled] = useState(false)

  useEffect(() => {
    if (!open) { setYesEnabled(false); return }
    haptic('medium')
    const t = setTimeout(() => setYesEnabled(true), 3000)
    return () => clearTimeout(t)
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        textAlign: 'center',
        animation: 'wmFadeIn 0.3s ease forwards',
      }}
    >
      <style>{`
        @keyframes wmFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes wmStroke { from { stroke-dashoffset: 100 } to { stroke-dashoffset: 0 } }
      `}</style>

      <div style={{
        fontFamily: 'var(--font-inter), sans-serif',
        fontSize: '32px', fontWeight: 800, fontStyle: 'italic',
        textTransform: 'uppercase', letterSpacing: '-0.04em',
        color: '#ffffff', marginBottom: '30px',
      }}>
        ТЫ УВЕРЕН?
      </div>

      <div style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: '16px', fontWeight: 600, lineHeight: 1.4, color: '#fff', marginBottom: '12px' }}>
        Раз в месяц ты можешь<br />сменить фото только 3 раза
      </div>
      <div style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '10px' }}>
        У тебя осталось {attemptsLeft} {attemptsLeft === 1 ? 'раз' : 'раза'}
      </div>
      <div style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '30px' }}>
        Всё равно хочешь продолжить?
      </div>

      <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '320px' }}>
        {/* ДА — с анимированной обводкой 3с */}
        <button
          onClick={() => { if (yesEnabled) { haptic('medium'); onConfirm() } }}
          disabled={!yesEnabled}
          style={{
            flex: 1,
            padding: '16px 0',
            borderRadius: '100px',
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '18px',
            fontWeight: 700,
            cursor: yesEnabled ? 'pointer' : 'not-allowed',
            position: 'relative',
            background: 'transparent',
            color: '#ffffff',
            border: yesEnabled ? '2px solid #ffffff' : '2px solid transparent',
            overflow: 'visible',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {!yesEnabled && (
            <svg
              style={{ position: 'absolute', top: '-2px', left: '-2px', width: 'calc(100% + 4px)', height: 'calc(100% + 4px)', pointerEvents: 'none' }}
            >
              <rect
                x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="27"
                pathLength={100}
                style={{
                  fill: 'none',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  strokeDasharray: 100,
                  animation: 'wmStroke 3s linear forwards',
                }}
              />
            </svg>
          )}
          <span style={{ position: 'relative', zIndex: 2 }}>ДА</span>
        </button>

        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '16px 0',
            borderRadius: '100px',
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '18px',
            fontWeight: 700,
            cursor: 'pointer',
            background: '#ffffff',
            color: '#000000',
            border: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          НЕТ
        </button>
      </div>
    </div>
  )
}

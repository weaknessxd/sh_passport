'use client'

import { DEFAULT_THEME, type ThemeConfig } from '@/lib/passport/theme'

type StampData = {
  id: number
  name: string
  icon?: string | null
  issued_at?: string | null
}

type Props = {
  stamps?: StampData[]
  pageIndex: number
  stampsPerPage?: number
  themeConfig?: ThemeConfig
}

const CARD_W = 422
const CARD_H = 760
const CARD_LEFT = 4
const PAD = 26

/** Иконка штампа: путь/URL → картинка, иначе текст (эмодзи). */
function StampIcon({ icon }: { icon: string | null | undefined }) {
  const v = icon ?? '★'
  const isImage = v.startsWith('/') || v.startsWith('http') || v.startsWith('data:')
  if (isImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={v} alt="" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
  }
  return <span style={{ fontSize: '30px', lineHeight: 1 }}>{v}</span>
}

export function StampsPage({ stamps = [], pageIndex, stampsPerPage = 8, themeConfig }: Props) {
  const t = themeConfig ?? DEFAULT_THEME
  const start = pageIndex * stampsPerPage
  const slots = Array.from({ length: stampsPerPage }, (_, i) => stamps[start + i] ?? null)

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: `${CARD_LEFT}px`,
          width: `${CARD_W}px`,
          height: `${CARD_H}px`,
          background: t.colors.card_bg,
          borderRadius: '28px',
          overflow: 'hidden',
        }}
      >
        {/* Водяной знак — низ карточки */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={t.watermark_stamps}
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '24px',
            left: 0,
            width: '100%',
            filter: 'brightness(0) opacity(0.08)',
            pointerEvents: 'none',
          }}
        />

        {/* Сетка слотов 2×4 — растянута на всю высоту карточки */}
        <div
          style={{
            position: 'absolute',
            top: `${PAD}px`,
            bottom: '52px',
            left: `${PAD}px`,
            width: `${CARD_W - PAD * 2}px`,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            columnGap: '28px',
            alignContent: 'space-between',
          }}
        >
          {slots.map((stamp, i) => (
            <div
              key={i}
              style={{
                height: '118px',
                border: `1.5px dashed ${t.colors.border}`,
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                overflow: 'hidden',
                padding: '6px',
                boxSizing: 'border-box',
              }}
            >
              {stamp && (
                <>
                  <StampIcon icon={stamp.icon} />
                  <div
                    style={{
                      fontFamily: 'var(--font-inter), sans-serif',
                      fontWeight: 700,
                      fontSize: '11px',
                      letterSpacing: '-0.03em',
                      color: t.colors.text,
                      textAlign: 'center',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {stamp.name}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Номер страницы */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 800,
            fontStyle: 'italic',
            fontSize: '24px',
            color: t.colors.border,
          }}
        >
          {pageIndex + 1}
        </div>
      </div>
    </div>
  )
}

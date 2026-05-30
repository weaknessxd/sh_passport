'use client'

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
}

const CARD_W = 410
const CARD_H = 760
const PAD = 26

export function StampsPage({ stamps = [], pageIndex, stampsPerPage = 8 }: Props) {
  const start = pageIndex * stampsPerPage
  const slots = Array.from({ length: stampsPerPage }, (_, i) => stamps[start + i] ?? null)

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          width: `${CARD_W}px`,
          height: `${CARD_H}px`,
          background: '#D9D9D9',
          borderRadius: '28px',
          overflow: 'hidden',
        }}
      >
        {/* Creatures watermark — bottom */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/creatures.svg"
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '0',
            width: '100%',
            filter: 'brightness(0) opacity(0.07)',
            pointerEvents: 'none',
          }}
        />

        {/* 2×4 grid of stamp slots */}
        <div
          style={{
            position: 'absolute',
            top: `${PAD}px`,
            left: `${PAD}px`,
            width: `${CARD_W - PAD * 2}px`,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          {slots.map((stamp, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '160 / 96',
                border: '1.5px dashed #9a9a9a',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {stamp && (
                <div style={{ textAlign: 'center', padding: '6px' }}>
                  <div style={{ fontSize: '26px', lineHeight: 1 }}>{stamp.icon ?? '★'}</div>
                  <div
                    style={{
                      fontFamily: 'var(--font-inter), sans-serif',
                      fontWeight: 700,
                      fontSize: '11px',
                      letterSpacing: '-0.03em',
                      color: '#111',
                      marginTop: '4px',
                    }}
                  >
                    {stamp.name}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Page number in card */}
        <div
          style={{
            position: 'absolute',
            bottom: '14px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 700,
            fontSize: '12px',
            color: '#7a7a7a',
          }}
        >
          {pageIndex + 1}
        </div>
      </div>
    </div>
  )
}

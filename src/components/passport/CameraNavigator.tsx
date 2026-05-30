'use client'

import { motion } from 'framer-motion'

type PageMeta = {
  /** Short label shown inside the active ring ('' = none) */
  label: string
}

type Props = {
  pages: PageMeta[]
  current: number
  onSelect: (index: number) => void
}

const SLOT = 52 // fixed horizontal slot per item
const CONTAINER_W = 430

function dotSize(dist: number): number {
  if (dist === 1) return 20
  if (dist === 2) return 12
  return 7
}

export function CameraNavigator({ pages, current, onSelect }: Props) {
  // translate the row so the active item is centered
  const offsetX = CONTAINER_W / 2 - (current * SLOT + SLOT / 2)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '46px',
        left: 0,
        width: `${CONTAINER_W}px`,
        height: '60px',
        overflow: 'hidden',
      }}
    >
      <motion.div
        animate={{ x: offsetX }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          display: 'flex',
        }}
      >
        {pages.map((page, i) => {
          const dist = Math.abs(i - current)
          const active = dist === 0
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              style={{
                width: `${SLOT}px`,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {active ? (
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '999px',
                    border: '3px solid #ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-inter), sans-serif',
                    fontWeight: 800,
                    fontSize: '16px',
                    color: '#ffffff',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {page.label}
                </div>
              ) : (
                <div
                  style={{
                    width: `${dotSize(dist)}px`,
                    height: `${dotSize(dist)}px`,
                    borderRadius: '999px',
                    background: '#6b6b6b',
                  }}
                />
              )}
            </button>
          )
        })}
      </motion.div>
    </div>
  )
}

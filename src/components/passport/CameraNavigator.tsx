'use client'

import { useRef } from 'react'
import { motion, type PanInfo } from 'framer-motion'

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
  const containerRef = useRef<HTMLDivElement>(null)

  // translate the row so the active item is centered
  const offsetX = CONTAINER_W / 2 - (current * SLOT + SLOT / 2)
  const minX = CONTAINER_W / 2 - ((pages.length - 1) * SLOT + SLOT / 2)
  const maxX = CONTAINER_W / 2 - SLOT / 2

  function handleDragEnd(_e: unknown, info: PanInfo) {
    // account for the stage scale so a finger-drag maps to the right page count
    const rect = containerRef.current?.getBoundingClientRect()
    const scale = rect ? rect.width / CONTAINER_W : 1
    const slotScreen = SLOT * scale || SLOT
    const moved = info.offset.x + info.velocity.x * 0.08
    let target = current - Math.round(moved / slotScreen)
    target = Math.max(0, Math.min(pages.length - 1, target))
    onSelect(target)
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        bottom: '24px',
        left: 0,
        width: `${CONTAINER_W}px`,
        height: '60px',
        overflow: 'hidden',
        touchAction: 'pan-y',
      }}
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: minX, right: maxX }}
        dragElastic={0.08}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={{ x: offsetX }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          display: 'flex',
          cursor: 'grab',
        }}
      >
        {pages.map((page, i) => {
          const dist = Math.abs(i - current)
          const active = dist === 0
          return (
            <div
              key={i}
              onClick={() => onSelect(i)}
              style={{
                width: `${SLOT}px`,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
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
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent, animate, type PanInfo } from 'framer-motion'

type PageMeta = {
  /** Short label shown inside the active ring ('' = none) */
  label: string
}

type Props = {
  pages: PageMeta[]
  current: number
  onSelect: (index: number) => void
}

const SLOT = 52
const CONTAINER_W = 430
const RING = 46
const DOT = 8

function centerForIndex(i: number): number {
  return CONTAINER_W / 2 - (i * SLOT + SLOT / 2)
}
function indexFromX(x: number): number {
  return (CONTAINER_W / 2 - SLOT / 2 - x) / SLOT
}
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function CameraNavigator({ pages, current, onSelect }: Props) {
  const x = useMotionValue(centerForIndex(current))
  const [live, setLive] = useState(current) // continuous center index
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  // keep `live` in sync with the row position (drives the liquid morph)
  useMotionValueEvent(x, 'change', (v) => setLive(indexFromX(v)))

  // animate to the committed page when it changes (tap / external)
  useEffect(() => {
    if (dragging.current) return
    const controls = animate(x, centerForIndex(current), {
      type: 'spring', stiffness: 340, damping: 36,
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  const minX = centerForIndex(pages.length - 1)
  const maxX = centerForIndex(0)

  function handleDragEnd(_e: unknown, info: PanInfo) {
    dragging.current = false
    const rect = containerRef.current?.getBoundingClientRect()
    const scale = rect ? rect.width / CONTAINER_W : 1
    let target = Math.round(live)
    // flick adds one step in the drag direction
    if (Math.abs(info.velocity.x) > 350 / (scale || 1)) {
      target += info.velocity.x < 0 ? 1 : -1
    }
    target = clamp(target, 0, pages.length - 1)
    animate(x, centerForIndex(target), { type: 'spring', stiffness: 340, damping: 36 })
    if (target !== current) onSelect(target)
  }

  const nearest = clamp(Math.round(live), 0, pages.length - 1)

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
        dragElastic={0.06}
        dragMomentum={false}
        onDragStart={() => { dragging.current = true }}
        onDragEnd={handleDragEnd}
        style={{ x, position: 'absolute', top: 0, left: 0, height: '100%', display: 'flex', cursor: 'grab' }}
      >
        {pages.map((page, i) => {
          const dist = Math.abs(i - live)
          const t = Math.max(0, 1 - dist) // 1 at center → 0 a slot away
          const size = DOT + (RING - DOT) * t
          const isCenter = i === nearest
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
              <div
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '999px',
                  border: `3px solid rgba(255,255,255,${t})`,
                  background: `rgba(107,107,107,${1 - t})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontWeight: 800,
                  fontSize: '16px',
                  letterSpacing: '-0.03em',
                  color: '#ffffff',
                  overflow: 'hidden',
                }}
              >
                {isCenter && t > 0.5 ? page.label : ''}
              </div>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}

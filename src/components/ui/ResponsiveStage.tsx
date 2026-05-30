'use client'

import { useEffect, useRef, useState } from 'react'

// Design reference: iPhone 15 Pro Max logical viewport.
export const BASE_W = 430
export const BASE_H = 932

/**
 * Scales a fixed BASE_W×BASE_H design to fit any screen while preserving
 * proportions. All children use absolute px positions relative to the base
 * size; the whole stage is uniformly scaled and centered.
 *
 * Keyboard handling: on mobile, focusing an input shrinks window.innerHeight,
 * which would otherwise shrink the whole UI. We ignore height *decreases* that
 * happen without a width change (i.e. the on-screen keyboard) and only react to
 * orientation / real viewport changes.
 */
export function ResponsiveStage({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1)
  const dims = useRef({ w: 0, h: 0 })

  useEffect(() => {
    function update() {
      const w = window.innerWidth
      let h = window.innerHeight
      // Same width + smaller height ⇒ keyboard opened. Keep the previous height.
      if (w === dims.current.w && h < dims.current.h) {
        h = dims.current.h
      }
      dims.current = { w, h }
      setScale(Math.min(w / BASE_W, h / BASE_H))
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${BASE_W}px`,
          height: `${BASE_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}

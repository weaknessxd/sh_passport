'use client'

import { useEffect, useState } from 'react'

// Design reference: iPhone 15 Pro Max logical viewport.
export const BASE_W = 430
export const BASE_H = 932

/**
 * Scales a fixed BASE_W×BASE_H design to fit any screen while preserving
 * proportions. All children use absolute px positions relative to the base
 * size; the whole stage is uniformly scaled and centered.
 */
export function ResponsiveStage({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function update() {
      const s = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H)
      setScale(s)
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

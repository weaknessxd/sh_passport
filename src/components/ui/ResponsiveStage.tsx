'use client'

import { useEffect, useRef, useState } from 'react'

// Design reference: iPhone 15 Pro Max logical viewport.
export const BASE_W = 430
export const BASE_H = 932

/**
 * Scales a fixed BASE_W×BASE_H design to fit any screen while preserving
 * proportions, and keeps the UI pinned when the on-screen keyboard opens.
 *
 * Three problems handled:
 *  1. Proportional fit — via `zoom` (scales the layout box, so nothing
 *     overflows and the browser can't scroll the page).
 *  2. Keyboard shrinking the scale — we ignore height *decreases* that happen
 *     without a width change (the keyboard) so the UI doesn't shrink.
 *  3. iOS pushing the screen up on input focus — iOS WKWebView ignores
 *     `interactive-widget` and either scrolls the document or pans the visual
 *     viewport. We reset document scroll and translate the stage by the visual
 *     viewport offset so the content stays put.
 */
export function ResponsiveStage({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1)
  const dims = useRef({ w: 0, h: 0 })
  const outerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const vv = window.visualViewport

    function updateScale() {
      const w = window.innerWidth
      let h = window.innerHeight
      // Same width + smaller height ⇒ keyboard opened. Keep previous height.
      if (w === dims.current.w && h < dims.current.h) h = dims.current.h
      dims.current = { w, h }
      setScale(Math.min(w / BASE_W, h / BASE_H))
    }

    function pin() {
      const el = outerRef.current
      if (!el) return
      const offsetTop = vv ? vv.offsetTop : 0
      el.style.transform = offsetTop ? `translateY(${offsetTop}px)` : 'none'
    }

    function resetScroll() {
      if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0)
      pin()
    }

    updateScale()
    pin()

    window.addEventListener('resize', updateScale)
    window.addEventListener('orientationchange', updateScale)
    window.addEventListener('scroll', resetScroll, { passive: true })
    window.addEventListener('focusin', resetScroll)
    vv?.addEventListener('resize', pin)
    vv?.addEventListener('scroll', pin)

    // Lock document scroll while the stage is mounted (restored on unmount so
    // scrollable pages like /settings are unaffected).
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('resize', updateScale)
      window.removeEventListener('orientationchange', updateScale)
      window.removeEventListener('scroll', resetScroll)
      window.removeEventListener('focusin', resetScroll)
      vv?.removeEventListener('resize', pin)
      vv?.removeEventListener('scroll', pin)
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [])

  return (
    <div
      ref={outerRef}
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
          // `zoom` scales the layout box too, so it always fits the viewport.
          zoom: scale,
          position: 'relative',
          flexShrink: 0,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  )
}

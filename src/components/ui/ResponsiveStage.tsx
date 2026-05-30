'use client'

import { useEffect, useRef, useState } from 'react'

// Design reference: iPhone 15 Pro Max logical viewport.
export const BASE_W = 430
export const BASE_H = 932

/**
 * Scales a fixed BASE_W×BASE_H design to fit any screen while preserving
 * proportions, and keeps the UI pinned when the iOS keyboard opens.
 *
 * iOS (Telegram WKWebView) ignores `interactive-widget` and pans the page up
 * on input focus. We defeat that by sizing/positioning the stage to the
 * *visual viewport* (window.visualViewport): it always covers exactly the
 * visible area, follows any pan via offsetTop, and top-anchors its content so
 * the top of the form stays put while the keyboard simply overlaps the bottom.
 * We also keep resetting scroll during iOS's focus animation.
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
      // Same width + smaller height ⇒ keyboard. Keep previous height.
      if (w === dims.current.w && h < dims.current.h) h = dims.current.h
      dims.current = { w, h }
      setScale(Math.min(w / BASE_W, h / BASE_H))
    }

    function syncViewport() {
      const el = outerRef.current
      if (!el) return
      if (vv) {
        el.style.top = `${vv.offsetTop}px`
        el.style.left = `${vv.offsetLeft}px`
        el.style.width = `${vv.width}px`
        el.style.height = `${vv.height}px`
      }
      // Cancel any programmatic scroll iOS performs to reveal the input.
      if (el.scrollTop !== 0) el.scrollTop = 0
      if (el.scrollLeft !== 0) el.scrollLeft = 0
      if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0)
    }

    // iOS animates the focus scroll over ~300ms — keep correcting for a bit.
    let rafId = 0
    let until = 0
    function chase() {
      syncViewport()
      if (performance.now() < until) rafId = requestAnimationFrame(chase)
    }
    function onFocusIn() {
      until = performance.now() + 500
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(chase)
    }

    updateScale()
    syncViewport()

    window.addEventListener('resize', updateScale)
    window.addEventListener('orientationchange', updateScale)
    window.addEventListener('scroll', syncViewport, { passive: true })
    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('focusout', syncViewport)
    vv?.addEventListener('resize', syncViewport)
    vv?.addEventListener('scroll', syncViewport)

    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', updateScale)
      window.removeEventListener('orientationchange', updateScale)
      window.removeEventListener('scroll', syncViewport)
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('focusout', syncViewport)
      vv?.removeEventListener('resize', syncViewport)
      vv?.removeEventListener('scroll', syncViewport)
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [])

  return (
    <div
      ref={outerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000000',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${BASE_W}px`,
          height: `${BASE_H}px`,
          // `zoom` scales the layout box, so it fits the viewport width/height.
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

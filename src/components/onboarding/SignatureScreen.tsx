'use client'

import { useEffect, useRef, useState } from 'react'
import { haptic } from '@/lib/telegram/haptics'

type Point = { x: number; y: number }

type Props = {
  onDone: (signatureSvg: string) => void
}

/**
 * Полноэкранный экран росписи (по прототипу): заголовок + reset, зона с
 * точечной сеткой, белая линия 4px. Подпись сохраняется как SVG, обрезанный
 * по bounding box с отступом 10px — чтобы идеально вписываться в паспорт.
 */
export function SignatureScreen({ onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const paths = useRef<Point[][]>([])
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)

  // Подгоняем canvas под размер обёртки (и при повороте)
  useEffect(() => {
    function fit() {
      const canvas = canvasRef.current
      const wrapper = wrapperRef.current
      if (!canvas || !wrapper) return
      // Сохраняем нарисованное при ресайзе? Прототип сбрасывает. Сбрасываем тоже.
      canvas.width = wrapper.offsetWidth
      canvas.height = wrapper.offsetHeight
      const ctx = canvas.getContext('2d')!
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      redraw()
    }
    fit()
    window.addEventListener('resize', fit)
    window.addEventListener('orientationchange', fit)
    return () => {
      window.removeEventListener('resize', fit)
      window.removeEventListener('orientationchange', fit)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function redraw() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const path of paths.current) {
      if (path.length < 2) continue
      ctx.beginPath()
      const first = path[0]!
      ctx.moveTo(first.x, first.y)
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i]!.x, path[i]!.y)
      ctx.stroke()
    }
  }

  function getPos(e: React.PointerEvent): Point {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onDown(e: React.PointerEvent) {
    e.preventDefault()
    drawing.current = true
    paths.current.push([getPos(e)])
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onMove(e: React.PointerEvent) {
    if (!drawing.current) return
    const path = paths.current[paths.current.length - 1]
    if (!path) return
    const pos = getPos(e)
    const prev = path[path.length - 1]
    path.push(pos)
    const ctx = canvasRef.current!.getContext('2d')!
    if (prev) {
      ctx.beginPath()
      ctx.moveTo(prev.x, prev.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
    if (!hasInk) setHasInk(true)
  }

  function onUp() {
    drawing.current = false
  }

  function clear() {
    haptic('light')
    paths.current = []
    redraw()
    setHasInk(false)
  }

  /** SVG, обрезанный по bounding box подписи (+10px поля). */
  function buildTrimmedSvg(): string | null {
    const pts = paths.current.flat()
    if (pts.length < 2) return null
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of pts) {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    }
    const pad = 10
    const x = minX - pad
    const y = minY - pad
    const w = maxX - minX + pad * 2
    const h = maxY - minY + pad * 2
    const pathEls = paths.current
      .filter((p) => p.length > 1)
      .map((p) => {
        const d = p.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ')
        return `<path d="${d}" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      })
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(0)}" height="${h.toFixed(0)}" viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}">${pathEls.join('')}</svg>`
  }

  function finish() {
    const svg = buildTrimmedSvg()
    if (!svg) return
    haptic('medium')
    onDone(svg)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        padding: 'max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))',
        boxSizing: 'border-box',
      }}
    >
      {/* Заголовок + reset */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>
          Распишись
        </span>
        <button
          onClick={clear}
          disabled={!hasInk}
          style={{
            background: 'transparent', border: 'none', cursor: hasInk ? 'pointer' : 'default',
            padding: '8px', opacity: hasInk ? 1 : 0.35, transition: 'opacity 0.2s',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Очистить"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" style={{ fill: 'none', stroke: '#fff', strokeWidth: 2 }}>
            <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </button>
      </div>

      {/* Зона росписи: точечная сетка */}
      <div
        ref={wrapperRef}
        style={{
          flexGrow: 1,
          border: '1px dashed #414141',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#080808',
          backgroundImage: 'radial-gradient(#333333 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          minHeight: '100px',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>

      {/* Кнопка */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', flexShrink: 0 }}>
        <button
          onClick={finish}
          disabled={!hasInk}
          style={{
            backgroundColor: hasInk ? '#ffffff' : '#414141',
            color: hasInk ? '#000000' : '#747373',
            border: 'none',
            borderRadius: '100px',
            padding: '14px 40px',
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '16px',
            fontWeight: 700,
            cursor: hasInk ? 'pointer' : 'not-allowed',
            minWidth: '200px',
            transition: 'all 0.2s ease',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Продолжить
        </button>
      </div>
    </div>
  )
}

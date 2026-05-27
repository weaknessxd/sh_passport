'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'

type Props = {
  onNext: (signatureSvg: string) => void
  onBack: () => void
  progress: number
}

type Platform = 'desktop' | 'mobile-portrait' | 'mobile-landscape'

function getTelegramPlatform(): 'desktop' | 'mobile' {
  try {
    const tg = (window as unknown as { Telegram?: { WebApp?: { platform?: string } } }).Telegram
    const p = tg?.WebApp?.platform ?? ''
    if (p === 'tdesktop' || p === 'weba' || p === 'webk' || p === 'web') return 'desktop'
  } catch { /* ignore */ }
  // fallback — check touchscreen
  return typeof window !== 'undefined' && 'ontouchstart' in window ? 'mobile' : 'desktop'
}

export function SignatureScreen({ onNext, onBack, progress }: Props) {
  const [platform, setPlatform] = useState<'desktop' | 'mobile'>('desktop')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    setPlatform(getTelegramPlatform())
    function updateOrientation() {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
    }
    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    return () => window.removeEventListener('resize', updateOrientation)
  }, [])

  const currentPlatform: Platform =
    platform === 'desktop'
      ? 'desktop'
      : orientation === 'landscape'
        ? 'mobile-landscape'
        : 'mobile-portrait'

  return (
    <AnimatePresence mode="wait">
      {currentPlatform === 'desktop' && (
        <DesktopSignature key="desktop" onNext={onNext} onBack={onBack} progress={progress} />
      )}
      {currentPlatform === 'mobile-portrait' && (
        <RotatePrompt key="rotate" />
      )}
      {currentPlatform === 'mobile-landscape' && (
        <LandscapeSignature key="landscape" onNext={onNext} onBack={onBack} />
      )}
    </AnimatePresence>
  )
}

// ─── Desktop / landscape shared canvas ───────────────────────────────────────

type CanvasProps = {
  width: number
  height: number
  onSigned: (svg: string) => void
  onClear: () => void
  hasSignature: boolean
}

function SignatureCanvas({ width, height, onSigned, onClear, hasSignature }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const paths = useRef<{ x: number; y: number; type: 'move' | 'line' }[][]>([])
  const currentPath = useRef<{ x: number; y: number; type: 'move' | 'line' }[]>([])

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const t = e.touches[0]
      if (!t) return { x: 0, y: 0 }
      return { x: t.clientX - rect.left, y: t.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function redraw() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawLogoPattern(ctx, canvas.width, canvas.height)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const path of paths.current) {
      if (!path.length) continue
      ctx.beginPath()
      for (const pt of path) {
        if (pt.type === 'move') ctx.moveTo(pt.x, pt.y)
        else ctx.lineTo(pt.x, pt.y)
      }
      ctx.stroke()
    }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    drawing.current = true
    currentPath.current = []
    const pos = getPos(e)
    currentPath.current.push({ ...pos, type: 'move' })
    redraw()
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawing.current) return
    const pos = getPos(e)
    currentPath.current.push({ ...pos, type: 'line' })
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const path = currentPath.current
    const prev = path[path.length - 2]
    const cur = path[path.length - 1]
    if (prev && cur) {
      ctx.beginPath()
      ctx.moveTo(prev.x, prev.y)
      ctx.lineTo(cur.x, cur.y)
      ctx.stroke()
    }
  }

  function endDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return
    drawing.current = false
    if (currentPath.current.length > 1) {
      paths.current.push([...currentPath.current])
      const svg = pathsToSvg(paths.current, width, height)
      onSigned(svg)
    }
    currentPath.current = []
  }

  function handleClear() {
    paths.current = []
    currentPath.current = []
    redraw()
    onClear()
  }

  // Draw logo pattern on mount / resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawLogoPattern(ctx, canvas.width, canvas.height)
  }, [width, height])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '1.2px solid #828282',
          display: 'block',
          touchAction: 'none',
          cursor: 'crosshair',
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      {/* Refresh icon — right edge, 5px outside */}
      <button
        onClick={handleClear}
        disabled={!hasSignature}
        style={{
          position: 'absolute',
          right: '-34px',
          top: '0',
          background: 'transparent',
          border: 'none',
          cursor: hasSignature ? 'pointer' : 'default',
          padding: '4px',
          opacity: hasSignature ? 1 : 0.35,
          transition: 'opacity 0.15s',
        }}
      >
        <Image src="/icons/refresh.png" alt="Очистить" width={24} height={24} />
      </button>
    </div>
  )
}

// ─── Desktop variant ──────────────────────────────────────────────────────────

function DesktopSignature({ onNext, onBack, progress }: Props) {
  const [svg, setSvg] = useState<string | null>(null)

  return (
    <>
      {/* Persistent progress bar */}
      <div
        style={{
          position: 'fixed',
          top: '40px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <ProgressBar progress={progress} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Back + heading */}
        <div style={{ position: 'absolute', top: '40px', width: '320px' }}>
          <button
            onClick={onBack}
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Image
              src="/icons/arrow.svg"
              alt="Назад"
              width={24}
              height={24}
              style={{ filter: 'brightness(0.5)', transition: 'filter 0.15s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.filter = 'brightness(1)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.filter = 'brightness(0.5)')}
            />
          </button>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span
              style={{
                fontFamily: 'var(--font-inter), sans-serif',
                fontWeight: 700,
                fontSize: '25px',
                letterSpacing: '-0.05em',
                color: '#ffffff',
                marginTop: '10px',
                display: 'block',
              }}
            >
              Распишись
            </span>
          </div>
        </div>

        {/* Canvas — centered */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          // offset for refresh icon that sticks out right
          marginRight: '34px',
        }}>
          <SignatureCanvas
            width={320}
            height={430}
            onSigned={setSvg}
            onClear={() => setSvg(null)}
            hasSignature={!!svg}
          />
        </div>

        <div style={{ position: 'absolute', bottom: '35px' }}>
          <Button onClick={() => svg && onNext(svg)} disabled={!svg}>
            Продолжить
          </Button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Mobile portrait — rotate prompt ─────────────────────────────────────────

function RotatePrompt() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-inter), sans-serif',
          fontWeight: 700,
          fontSize: '25px',
          letterSpacing: '-0.05em',
          color: '#ffffff',
        }}
      >
        Переверни телефон
      </span>
      <motion.div
        animate={{ rotate: [0, -90, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
      >
        <Image src="/icons/anim.svg" alt="Переверни" width={96} height={96} />
      </motion.div>
    </motion.div>
  )
}

// ─── Mobile landscape — signature ────────────────────────────────────────────

function LandscapeSignature({ onNext, onBack }: Pick<Props, 'onNext' | 'onBack'>) {
  const [svg, setSvg] = useState<string | null>(null)
  const [vw, setVw] = useState(0)
  const [vh, setVh] = useState(0)

  useEffect(() => {
    function update() {
      setVw(window.innerWidth)
      setVh(window.innerHeight)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  if (!vw || !vh) return null

  // Constraints:
  // left/right: 15px each side
  // top: ~60px (back + title + 3px gap)
  // bottom: button ~50px + 10px gap + 10px from bottom = 70px
  const PAD_H = 15
  const PAD_TOP = 60
  const BTN_AREA = 70
  const canvasW = vw - PAD_H * 2 - 34 // 34px for refresh icon on right
  const canvasH = Math.max(100, vh - PAD_TOP - BTN_AREA)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000',
        overflow: 'hidden',
      }}
    >
      {/* Back icon — left, vertically centered with "Распишись" */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          left: `${PAD_H}px`,
          top: `${PAD_TOP - 28}px`,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <Image
          src="/icons/arrow.svg"
          alt="Назад"
          width={24}
          height={24}
          style={{ filter: 'brightness(0.5)' }}
        />
      </button>

      {/* "Распишись" — right of canvas, 3px above it */}
      <div
        style={{
          position: 'absolute',
          right: `${PAD_H + 34}px`,
          top: `${PAD_TOP - 3 - 30}px`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 700,
            fontSize: '25px',
            letterSpacing: '-0.05em',
            color: '#ffffff',
          }}
        >
          Распишись
        </span>
      </div>

      {/* Canvas */}
      <div
        style={{
          position: 'absolute',
          top: `${PAD_TOP}px`,
          left: `${PAD_H}px`,
        }}
      >
        <SignatureCanvas
          width={canvasW}
          height={canvasH}
          onSigned={setSvg}
          onClear={() => setSvg(null)}
          hasSignature={!!svg}
        />
      </div>

      {/* Continue button — 10px below canvas */}
      <div
        style={{
          position: 'absolute',
          top: `${PAD_TOP + canvasH + 10}px`,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <Button onClick={() => svg && onNext(svg)} disabled={!svg}>
          Продолжить
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function drawLogoPattern(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Tiny щ pattern — draw "Щ" chars as text
  ctx.save()
  ctx.fillStyle = '#232323'
  ctx.font = '5px sans-serif'
  const step = 14
  for (let x = 0; x < w; x += step) {
    for (let y = step; y < h; y += step) {
      ctx.fillText('Щ', x, y)
    }
  }
  ctx.restore()
}

function pathsToSvg(
  paths: { x: number; y: number; type: 'move' | 'line' }[][],
  w: number,
  h: number,
): string {
  const pathEls = paths.map((path) => {
    const d = path
      .map((pt) => `${pt.type === 'move' ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
      .join(' ')
    return `<path d="${d}" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${pathEls.join('')}</svg>`
}

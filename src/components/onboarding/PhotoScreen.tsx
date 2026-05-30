'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'

// On-screen zone uses passport aspect ratio (320:430), sized with 10px side margins.
const ZONE_W = 410
const ZONE_H = Math.round((ZONE_W * 430) / 320) // ≈ 551
// Saved image resolution (kept small for the DB).
const OUT_W = 320
const OUT_H = 430
const MAX_ATTEMPTS = 3

type PhotoState =
  | { status: 'empty' }
  | { status: 'processing' }
  | { status: 'preview' }

type Props = {
  onNext: (photoDataUrl: string) => void
  onBack: () => void
  progress: number
}

export function PhotoScreen({ onNext, onBack, progress }: Props) {
  const [photoState, setPhotoState] = useState<PhotoState>({ status: 'empty' })
  const [attempts, setAttempts] = useState(MAX_ATTEMPTS)
  const [srcUrl, setSrcUrl] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const natural = useRef({ w: 0, h: 0 })
  const coverScale = useRef(1)
  const dispSize = useRef({ w: ZONE_W, h: ZONE_H })
  const zoneRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const drag = useRef<{ active: boolean; lastX: number; lastY: number; ratio: number }>({
    active: false, lastX: 0, lastY: 0, ratio: 1,
  })

  const canContinue = photoState.status === 'preview'

  function clampOffset(x: number, y: number) {
    const minX = ZONE_W - dispSize.current.w
    const minY = ZONE_H - dispSize.current.h
    return {
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y)),
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoState({ status: 'processing' })

    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      const img = new window.Image()
      img.onload = () => {
        natural.current = { w: img.naturalWidth, h: img.naturalHeight }
        const cs = Math.max(ZONE_W / img.naturalWidth, ZONE_H / img.naturalHeight)
        coverScale.current = cs
        dispSize.current = { w: img.naturalWidth * cs, h: img.naturalHeight * cs }
        // center the image
        setOffset(clampOffset((ZONE_W - dispSize.current.w) / 2, (ZONE_H - dispSize.current.h) / 2))
        setSrcUrl(url)
        // brief processing animation
        setTimeout(() => setPhotoState({ status: 'preview' }), 1000)
      }
      img.src = url
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleRetry() {
    if (attempts <= 1) return
    setAttempts((a) => a - 1)
    setPhotoState({ status: 'empty' })
    setSrcUrl(null)
    fileInputRef.current?.click()
  }

  // Pointer drag (accounts for on-screen scale of the stage)
  function onPointerDown(e: React.PointerEvent) {
    if (photoState.status !== 'preview') return
    const rect = zoneRef.current?.getBoundingClientRect()
    drag.current = {
      active: true,
      lastX: e.clientX,
      lastY: e.clientY,
      ratio: rect ? rect.width / ZONE_W : 1,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current.active) return
    const dx = (e.clientX - drag.current.lastX) / drag.current.ratio
    const dy = (e.clientY - drag.current.lastY) / drag.current.ratio
    drag.current.lastX = e.clientX
    drag.current.lastY = e.clientY
    setOffset((o) => clampOffset(o.x + dx, o.y + dy))
  }
  function onPointerUp() {
    drag.current.active = false
  }

  function handleContinue() {
    if (photoState.status !== 'preview' || !srcUrl) return
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = OUT_W
      canvas.height = OUT_H
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const cs = coverScale.current
      const sx = -offset.x / cs
      const sy = -offset.y / cs
      const sw = ZONE_W / cs
      const sh = ZONE_H / cs
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H)
      onNext(canvas.toDataURL('image/jpeg', 0.78))
    }
    img.src = srcUrl
  }

  return (
    <>
      {/* Persistent progress bar */}
      <div style={{ position: 'absolute', top: '40px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
        <ProgressBar progress={progress} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        style={{ position: 'absolute', inset: 0, background: '#000000' }}
      >
        {/* Back + heading */}
        <div style={{ position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)', width: `${ZONE_W}px` }}>
          <button
            onClick={onBack}
            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Image src="/icons/arrow.svg" alt="Назад" width={24} height={24} style={{ filter: 'brightness(0.5)' }} />
          </button>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 700, fontSize: '25px', letterSpacing: '-0.05em', color: '#ffffff', marginTop: '10px' }}>
              {photoState.status === 'processing' ? 'Фото обрабатывается' : 'Загрузи фото'}
            </span>
          </div>
        </div>

        {/* Photo zone — centered */}
        <div
          ref={zoneRef}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${ZONE_W}px`,
            height: `${ZONE_H}px`,
            border: '2px dashed #828282',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
            background: '#0a0a0a',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <AnimatePresence mode="wait">
            {photoState.status === 'empty' && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <UploadButton onClick={() => fileInputRef.current?.click()} />
              </motion.div>
            )}
            {photoState.status === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ProcessingSpinner />
              </motion.div>
            )}
            {photoState.status === 'preview' && srcUrl && (
              <motion.img
                key="preview"
                src={srcUrl}
                alt="Фото"
                draggable={false}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: 'absolute',
                  left: `${offset.x}px`,
                  top: `${offset.y}px`,
                  width: `${dispSize.current.w}px`,
                  height: `${dispSize.current.h}px`,
                  userSelect: 'none',
                  pointerEvents: 'none',
                  maxWidth: 'none',
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Hint + retry */}
        {photoState.status === 'preview' && (
          <div style={{ position: 'absolute', top: `calc(50% + ${ZONE_H / 2}px + 12px)`, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 500, fontSize: '13px', color: '#828282' }}>
              Подвигай фото, чтобы выбрать кадр
            </span>
            <button
              onClick={handleRetry}
              disabled={attempts <= 1}
              style={{
                background: '#EAEAEA', border: 'none', borderRadius: '8px', padding: '10px 25px',
                fontFamily: 'var(--font-inter), sans-serif', fontWeight: 700, fontSize: '18px',
                letterSpacing: '-0.05em', color: attempts <= 1 ? '#888' : '#000000',
                cursor: attempts <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Пересоздать ({attempts - 1})
            </button>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

        {/* Continue */}
        <div style={{ position: 'absolute', bottom: '35px', left: '50%', transform: 'translateX(-50%)' }}>
          <Button onClick={handleContinue} disabled={!canContinue}>Продолжить</Button>
        </div>
      </motion.div>
    </>
  )
}

function UploadButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#EAEAEA', border: 'none', borderRadius: '8px', padding: '10px 25px',
        fontFamily: 'var(--font-inter), sans-serif', fontWeight: 700, fontSize: '20px',
        letterSpacing: '-0.05em', color: '#000000', cursor: 'pointer',
      }}
    >
      Загрузить
    </button>
  )
}

function ProcessingSpinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    >
      <Image src="/icons/photo-loading.svg" alt="Загрузка" width={64} height={64} style={{ display: 'block' }} />
    </motion.div>
  )
}

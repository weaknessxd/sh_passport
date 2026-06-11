'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { haptic } from '@/lib/telegram/haptics'

// Выходное разрешение сохранённого фото (3:4, хранится base64 в БД)
const OUT_W = 480
const OUT_H = 640

export type PhotoZoneHandle = {
  /** Кадр по текущей позиции — dataURL jpeg, или null если фото нет */
  crop: () => string | null
  /** Открыть выбор файла */
  openPicker: () => void
}

type Props = {
  onHasPhoto: (has: boolean) => void
}

/**
 * Зона загрузки фото (3:4, max-height 55vh — как в прототипе).
 * Без кадрирования: фото вписывается по cover, пользователь двигает его
 * пальцем, выбирая сейф-зону.
 */
export const PhotoZone = forwardRef<PhotoZoneHandle, Props>(function PhotoZone({ onHasPhoto }, ref) {
  const [src, setSrc] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const zoneRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const imgNatural = useRef({ w: 0, h: 0 })
  const coverScale = useRef(1)
  const dispSize = useRef({ w: 0, h: 0 })
  const drag = useRef({ active: false, lastX: 0, lastY: 0 })

  function zoneRect() {
    return zoneRef.current?.getBoundingClientRect() ?? { width: 300, height: 400 }
  }

  function clampOffset(x: number, y: number) {
    const r = zoneRect()
    return {
      x: Math.min(0, Math.max(r.width - dispSize.current.w, x)),
      y: Math.min(0, Math.max(r.height - dispSize.current.h, y)),
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      const img = new window.Image()
      img.onload = () => {
        const r = zoneRect()
        imgNatural.current = { w: img.naturalWidth, h: img.naturalHeight }
        const cs = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight)
        coverScale.current = cs
        dispSize.current = { w: img.naturalWidth * cs, h: img.naturalHeight * cs }
        setOffset({ x: (r.width - dispSize.current.w) / 2, y: (r.height - dispSize.current.h) / 2 })
        setSrc(url)
        onHasPhoto(true)
        haptic('light')
      }
      img.src = url
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function onDown(e: React.PointerEvent) {
    if (!src) return
    drag.current = { active: true, lastX: e.clientX, lastY: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.lastX
    const dy = e.clientY - drag.current.lastY
    drag.current.lastX = e.clientX
    drag.current.lastY = e.clientY
    setOffset((o) => clampOffset(o.x + dx, o.y + dy))
  }
  function onUp() {
    drag.current.active = false
  }

  useImperativeHandle(ref, () => ({
    crop() {
      if (!src) return null
      const img = new window.Image()
      img.src = src
      const canvas = document.createElement('canvas')
      canvas.width = OUT_W
      canvas.height = OUT_H
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      const r = zoneRect()
      const cs = coverScale.current
      ctx.drawImage(img, -offset.x / cs, -offset.y / cs, r.width / cs, r.height / cs, 0, 0, OUT_W, OUT_H)
      return canvas.toDataURL('image/jpeg', 0.8)
    },
    openPicker() {
      inputRef.current?.click()
    },
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div
        ref={zoneRef}
        style={{
          width: '100%',
          aspectRatio: '3 / 4',
          maxHeight: '55vh',
          border: src ? 'none' : '2px dashed #414141',
          borderRadius: '32px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'none',
          transition: 'border 0.3s ease',
          boxSizing: 'border-box',
        }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Фото"
            draggable={false}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${dispSize.current.w}px`,
              height: `${dispSize.current.h}px`,
              transform: `translate(${offset.x}px, ${offset.y}px)`,
              maxWidth: 'none',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              backgroundColor: '#747373',
              color: '#ffffff',
              padding: '14px 32px',
              borderRadius: '100px',
              fontFamily: 'var(--font-inter), sans-serif',
              fontSize: '16px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Загрузить
          </button>
        )}
      </div>

      {src && (
        <>
          <span style={{ marginTop: '12px', fontFamily: 'var(--font-inter), sans-serif', fontSize: '13px', fontWeight: 500, color: '#747373' }}>
            Подвигай фото, чтобы выбрать кадр
          </span>
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              marginTop: '12px',
              backgroundColor: '#747373',
              color: '#ffffff',
              padding: '12px 28px',
              borderRadius: '100px',
              fontFamily: 'var(--font-inter), sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Другое
          </button>
        </>
      )}

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  )
})

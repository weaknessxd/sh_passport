'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'

// Drop zone aspect ratio 320:430
const CROP_ASPECT = 320 / 430
const DROP_W = 320
const DROP_H = 430
const MAX_ATTEMPTS = 3

type PhotoState =
  | { status: 'empty' }
  | { status: 'processing' }
  | { status: 'preview'; dataUrl: string }

type Props = {
  onNext: (photoDataUrl: string) => void
  onBack: () => void
  progress: number
}

export function PhotoScreen({ onNext, onBack, progress }: Props) {
  const [photoState, setPhotoState] = useState<PhotoState>({ status: 'empty' })
  const [attempts, setAttempts] = useState(MAX_ATTEMPTS)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop>()
  const [srcUrl, setSrcUrl] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canContinue = photoState.status === 'preview'

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoState({ status: 'processing' })

    const reader = new FileReader()
    reader.onload = () => {
      setSrcUrl(reader.result as string)
      setPhotoState({ status: 'processing' })
      // Show processing spinner briefly, then load into crop
      setTimeout(() => {
        setPhotoState({ status: 'preview', dataUrl: reader.result as string })
      }, 1200)
    }
    reader.readAsDataURL(file)

    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget
    const initial = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, CROP_ASPECT, width, height),
      width,
      height,
    )
    setCrop(initial)
    setCompletedCrop(initial)
  }

  function handleRetry() {
    if (attempts <= 1) return
    setAttempts((a) => a - 1)
    setPhotoState({ status: 'empty' })
    setSrcUrl(null)
    setCrop(undefined)
    fileInputRef.current?.click()
  }

  function getCroppedDataUrl(): string {
    if (photoState.status !== 'preview' || !imgRef.current || !completedCrop) {
      return photoState.status === 'preview' ? photoState.dataUrl : ''
    }
    const canvas = document.createElement('canvas')
    canvas.width = DROP_W
    canvas.height = DROP_H
    const ctx = canvas.getContext('2d')!
    const img = imgRef.current
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height
    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, DROP_W, DROP_H,
    )
    return canvas.toDataURL('image/jpeg', 0.75)
  }

  function handleContinue() {
    const dataUrl = getCroppedDataUrl()
    if (dataUrl) onNext(dataUrl)
  }

  return (
    <>
      {/* Persistent progress bar */}
      <div
        style={{
          position: 'absolute',
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

      {/* Fading content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflowY: 'auto',
        }}
      >
        {/* Back + heading */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            width: '320px',
          }}
        >
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
              {photoState.status === 'processing' ? 'Фото обрабатывается' : 'Загрузи фото'}
            </span>
          </div>
        </div>

        {/* Drop zone — centered on screen */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${DROP_W}px`,
            height: `${DROP_H}px`,
            border: '2px dashed #828282',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <AnimatePresence mode="wait">
            {photoState.status === 'empty' && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <UploadButton onClick={() => fileInputRef.current?.click()} />
              </motion.div>
            )}

            {photoState.status === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ProcessingSpinner />
              </motion.div>
            )}

            {photoState.status === 'preview' && srcUrl && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ width: '100%', height: '100%' }}
              >
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={CROP_ASPECT}
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={srcUrl}
                    alt="Preview"
                    onLoad={onImageLoad}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </ReactCrop>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Retry button — 10px below drop zone */}
        {photoState.status === 'preview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              top: `calc(50% + ${DROP_H / 2}px + 10px)`,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <button
              onClick={handleRetry}
              disabled={attempts <= 1}
              style={{
                background: '#EAEAEA',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 25px',
                fontFamily: 'var(--font-inter), sans-serif',
                fontWeight: 700,
                fontSize: '20px',
                letterSpacing: '-0.05em',
                color: attempts <= 1 ? '#888' : '#000000',
                cursor: attempts <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Пересоздать ({attempts - 1})
            </button>
          </motion.div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Continue button */}
        <div style={{ position: 'absolute', bottom: '35px' }}>
          <Button onClick={handleContinue} disabled={!canContinue}>
            Продолжить
          </Button>
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
        background: '#EAEAEA',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 25px',
        fontFamily: 'var(--font-inter), sans-serif',
        fontWeight: 700,
        fontSize: '20px',
        letterSpacing: '-0.05em',
        color: '#000000',
        cursor: 'pointer',
      }}
    >
      Загрузить
    </button>
  )
}

function ProcessingSpinner() {
  return (
    <motion.div
      animate={{
        rotate: 360,
        strokeWidth: [2, 4, 2],
      }}
      transition={{
        rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
        strokeWidth: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <Image
        src="/icons/photo-loading.svg"
        alt="Загрузка"
        width={64}
        height={64}
        style={{ display: 'block' }}
      />
    </motion.div>
  )
}

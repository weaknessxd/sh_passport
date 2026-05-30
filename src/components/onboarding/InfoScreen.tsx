'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { InputField } from '@/components/ui/InputField'
import { ProgressBar } from '@/components/ui/ProgressBar'

type FormData = {
  first_name: string
  last_name: string
  gender: 'М' | 'Ж' | 'Щ' | ''
  birth_date: string
  city: string
}

type Props = {
  onNext: (data: FormData) => void
  onBack: () => void
  progress: number
  /** When true, progress bar is the persistent one (not faded) */
  persistProgressBar?: boolean
}

const GENDER_OPTIONS = ['М', 'Ж', 'Щ'] as const

export function InfoScreen({ onNext, onBack, progress }: Props) {
  const [form, setForm] = useState<FormData>({
    first_name: '',
    last_name: '',
    gender: '',
    birth_date: '',
    city: '',
  })
  const [highlightEmpty, setHighlightEmpty] = useState(false)

  const isComplete =
    form.first_name.trim() !== '' &&
    form.last_name.trim() !== '' &&
    form.gender !== '' &&
    form.birth_date !== '' &&
    form.city.trim() !== ''

  function set(field: keyof FormData) {
    return (v: string) => {
      setForm((prev) => ({ ...prev, [field]: v }))
      setHighlightEmpty(false)
    }
  }

  function handleContinue() {
    if (!isComplete) {
      setHighlightEmpty(true)
      setTimeout(() => setHighlightEmpty(false), 3000)
      return
    }
    onNext(form)
  }

  return (
    <>
      {/* Persistent progress bar area */}
      <div
        style={{
          position: 'absolute',
          top: '40px',
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
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
        }}
      >
        {/* Back icon + heading — aligned to progress bar edges */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            width: '320px',
          }}
        >
          {/* Back arrow — vertically centered with heading text */}
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
              display: 'flex',
              alignItems: 'center',
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

          {/* Heading — aligned to right edge of progress bar */}
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
              Расскажи о себе
            </span>
          </div>
        </div>

        {/* Inputs group — 180px from top (40px bar + heading height + spacing = ~180px) */}
        <div
          style={{
            position: 'absolute',
            top: '180px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            alignItems: 'flex-start',
            width: '320px',
          }}
        >
          <InputField
            placeholder="Имя"
            value={form.first_name}
            onChange={set('first_name')}
            highlightEmpty={highlightEmpty && form.first_name.trim() === ''}
          />
          <InputField
            placeholder="Фамилия"
            value={form.last_name}
            onChange={set('last_name')}
            highlightEmpty={highlightEmpty && form.last_name.trim() === ''}
          />

          {/* Gender toggle */}
          <GenderToggle
            value={form.gender}
            onChange={(v) => { setForm((p) => ({ ...p, gender: v })); setHighlightEmpty(false) }}
            highlight={highlightEmpty && form.gender === ''}
          />

          <InputField
            placeholder="Дата рождения"
            value={form.birth_date}
            onChange={set('birth_date')}
            type="date"
            highlightEmpty={highlightEmpty && form.birth_date === ''}
          />
          <InputField
            placeholder="Город"
            value={form.city}
            onChange={set('city')}
            highlightEmpty={highlightEmpty && form.city.trim() === ''}
          />
        </div>

        {/* Continue button */}
        <div style={{ position: 'absolute', bottom: '35px' }}>
          <Button onClick={handleContinue} disabled={false}>
            Продолжить
          </Button>
        </div>
      </motion.div>
    </>
  )
}

function GenderToggle({
  value,
  onChange,
  highlight,
}: {
  value: string
  onChange: (v: 'М' | 'Ж' | 'Щ') => void
  highlight: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: '0', width: '320px', height: '30px' }}>
      {GENDER_OPTIONS.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              flex: 1,
              height: '30px',
              background: 'transparent',
              border: 'none',
              borderBottom: highlight && !active
                ? '1.2px solid #ff4444'
                : active
                  ? '1.2px solid #ffffff'
                  : '1.2px solid #414141',
              color: active ? '#ffffff' : highlight ? '#ff4444' : '#414141',
              fontFamily: 'var(--font-inter), sans-serif',
              fontWeight: 700,
              fontSize: '20px',
              letterSpacing: '-0.05em',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

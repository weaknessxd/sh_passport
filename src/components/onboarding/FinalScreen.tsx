'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

type Props = {
  onEnter: () => void
}

// passportfinal.svg native size 345×489.
// Width-limited: 10px margins on each side of the 430px base → 410px wide.
const CARD_W = 410
const CARD_H = Math.round((CARD_W * 489) / 345) // ≈ 581

export function FinalScreen({ onEnter }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'absolute',
        inset: 0,
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Heading — 40px from top */}
      <span
        style={{
          position: 'absolute',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-inter), sans-serif',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: '40px',
          letterSpacing: '-0.12em',
          wordSpacing: '0.35em',
          lineHeight: 1,
          color: '#ffffff',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        ТВОЙ ПАСПОРТ<br />ГОТОВ
      </span>

      {/* Passport final image — centered, 10px from side edges */}
      <div
        style={{
          position: 'absolute',
          top: '150px',
          left: '10px',
        }}
      >
        <Image
          src="/icons/passportfinal.svg"
          alt="Паспорт готов"
          width={CARD_W}
          height={CARD_H}
          style={{ display: 'block' }}
        />
      </div>

      {/* Button */}
      <div style={{ position: 'absolute', bottom: '35px' }}>
        <Button onClick={onEnter}>Продолжить</Button>
      </div>
    </motion.div>
  )
}

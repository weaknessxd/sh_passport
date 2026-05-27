'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

type Props = {
  onEnter: () => void
}

export function FinalScreen({ onEnter }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed',
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
          color: '#ffffff',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        ТВОЙ ПАСПОРТ ГОТОВ
      </span>

      {/* Passport final image — 35px below heading */}
      <div
        style={{
          position: 'absolute',
          top: `${40 + 56 + 35}px`, // heading top + approx heading height + gap
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <Image
          src="/icons/passportfinal.svg"
          alt="Паспорт готов"
          width={320}
          height={320}
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

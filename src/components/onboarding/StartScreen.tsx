'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

type Props = {
  onRegister: () => void
}

export function StartScreen({ onRegister }: Props) {
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
      {/* Logo + title group — always centered on screen */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        <Image
          src="/icons/logo.svg"
          alt="Щёлочь"
          width={125}
          height={125}
          style={{ color: '#ffffff' }}
        />
        <span
          style={{
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: '40px',
            letterSpacing: '-0.12em',
            color: '#ffffff',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          паспорт
        </span>
      </div>

      {/* Button — 35px from bottom */}
      <div style={{ position: 'absolute', bottom: '35px' }}>
        <Button onClick={onRegister}>Зарегистрироваться</Button>
      </div>
    </motion.div>
  )
}

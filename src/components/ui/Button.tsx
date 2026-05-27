'use client'

import { motion } from 'framer-motion'

type Props = {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}

/**
 * Primary onboarding button.
 * Initial:  white bg, black text, py-[10px] px-[75px]
 * Tap/hold: py-[15px] px-[85px]
 * Disabled: #414141 bg, #747373 text, same padding as initial
 */
export function Button({ children, onClick, disabled = false, type = 'button', className = '' }: Props) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { paddingTop: '15px', paddingBottom: '15px', paddingLeft: '85px', paddingRight: '85px' }}
      whileHover={disabled ? {} : { paddingTop: '15px', paddingBottom: '15px', paddingLeft: '85px', paddingRight: '85px' }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '75px',
        paddingRight: '75px',
        backgroundColor: disabled ? '#414141' : '#ffffff',
        color: disabled ? '#747373' : '#000000',
        borderRadius: '999px',
        fontFamily: 'var(--font-inter), sans-serif',
        fontWeight: 700,
        fontSize: '25px',
        letterSpacing: '-0.05em',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
      className={className}
    >
      {children}
    </motion.button>
  )
}

'use client'

import { motion } from 'framer-motion'

type Size = 'lg' | 'md'

type Props = {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
  /** lg = onboarding (default), md = passport action pills */
  size?: Size
}

const SIZES: Record<Size, { py: number; px: number; pyHover: number; pxHover: number; font: number }> = {
  lg: { py: 10, px: 75, pyHover: 15, pxHover: 85, font: 25 },
  md: { py: 13, px: 34, pyHover: 15, pxHover: 40, font: 21 },
}

/**
 * Primary white pill button used across the app.
 * Initial: white bg, black text. Hover/tap: padding grows.
 * Disabled: #414141 bg, #747373 text, same padding as initial.
 */
export function Button({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  size = 'lg',
}: Props) {
  const s = SIZES[size]
  const hover = disabled
    ? {}
    : {
        paddingTop: `${s.pyHover}px`,
        paddingBottom: `${s.pyHover}px`,
        paddingLeft: `${s.pxHover}px`,
        paddingRight: `${s.pxHover}px`,
      }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={hover}
      whileHover={hover}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{
        paddingTop: `${s.py}px`,
        paddingBottom: `${s.py}px`,
        paddingLeft: `${s.px}px`,
        paddingRight: `${s.px}px`,
        backgroundColor: disabled ? '#414141' : '#ffffff',
        color: disabled ? '#747373' : '#000000',
        borderRadius: '999px',
        fontFamily: 'var(--font-inter), sans-serif',
        fontWeight: 700,
        fontSize: `${s.font}px`,
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

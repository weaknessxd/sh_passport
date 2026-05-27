'use client'

import { useState } from 'react'

type Props = {
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
  error?: string
  /** If true, placeholder turns red until user starts typing */
  highlightEmpty?: boolean
}

/**
 * Underline-only input.
 * Width 320px, height 30px, no fill.
 * Placeholder: Inter Bold 20px, #414141, -5% letter-spacing
 * Hover: placeholder → white
 * Focus: caret #EAEAEA 25px×3px, bottom border #414141 1.2px
 * Error: bottom border red, error text Inter Medium 12px red
 */
export function InputField({ placeholder, value, onChange, type = 'text', error, highlightEmpty = false }: Props) {
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)

  const isEmpty = value.trim() === ''
  const showEmptyHighlight = highlightEmpty && isEmpty

  return (
    <div style={{ width: '320px' }}>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          placeholder={placeholder}
          style={{
            width: '320px',
            height: '30px',
            background: 'transparent',
            border: 'none',
            borderBottom: error
              ? '1.2px solid #ff4444'
              : '1.2px solid #414141',
            outline: 'none',
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 700,
            fontSize: '20px',
            letterSpacing: '-0.05em',
            color: '#ffffff',
            caretColor: '#EAEAEA',
            padding: '0 0 4px 0',
          }}
          // CSS trick for caret size (not directly styleable — we use standard caret)
        />
        <style>{`
          input::placeholder {
            color: ${showEmptyHighlight ? '#ff4444' : hovered || focused ? '#ffffff' : '#414141'};
            font-weight: 700;
            font-size: 20px;
            letter-spacing: -0.05em;
            transition: color 0.15s;
          }
        `}</style>
      </div>
      {error && (
        <p style={{
          fontFamily: 'var(--font-inter), sans-serif',
          fontWeight: 500,
          fontSize: '12px',
          color: '#ff4444',
          marginTop: '4px',
        }}>
          {error}
        </p>
      )}
    </div>
  )
}

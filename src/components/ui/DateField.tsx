'use client'

import { useState } from 'react'

type Props = {
  /** Initial ISO date (yyyy-mm-dd) or '' */
  value: string
  /** Emits ISO date (yyyy-mm-dd) when valid, otherwise '' */
  onChange: (iso: string) => void
  placeholder?: string
  error?: string
  highlightEmpty?: boolean
}

function isoToDisplay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return ''
  return `${m[3]}.${m[2]}.${m[1]}`
}

/** Keeps only digits, formats as DD.MM.YYYY, max 8 digits. */
function maskDate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8)
  const dd = digits.slice(0, 2)
  const mm = digits.slice(2, 4)
  const yyyy = digits.slice(4, 8)
  let out = dd
  if (digits.length >= 2) out += '.' + mm
  if (digits.length >= 4) out += '.' + yyyy
  return out
}

/** Returns ISO yyyy-mm-dd if the DD.MM.YYYY string is a real date, else null. */
function displayToIso(display: string): string | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(display)
  if (!m) return null
  const dd = Number(m[1])
  const mm = Number(m[2])
  const yyyy = Number(m[3])
  if (mm < 1 || mm > 12) return null
  if (dd < 1 || dd > 31) return null
  const now = new Date().getFullYear()
  if (yyyy < 1900 || yyyy > now) return null
  const date = new Date(yyyy, mm - 1, dd)
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
    return null // e.g. 31.02
  }
  return `${m[3]}-${m[2]}-${m[1]}`
}

/**
 * Masked date input — always shows день.месяц.год (DD.MM.YYYY) regardless of
 * device locale. Emits an ISO yyyy-mm-dd string (or '' while incomplete).
 * Visually identical to InputField.
 */
export function DateField({ value, onChange, placeholder = 'Дата рождения', error, highlightEmpty = false }: Props) {
  const [display, setDisplay] = useState(() => isoToDisplay(value))
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)

  const showEmptyHighlight = highlightEmpty && display.trim() === ''

  function handleChange(raw: string) {
    const masked = maskDate(raw)
    setDisplay(masked)
    const iso = displayToIso(masked)
    onChange(iso ?? '')
  }

  return (
    <div style={{ width: '320px' }}>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={(e) => handleChange(e.target.value)}
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
          borderBottom: error ? '1.2px solid #ff4444' : '1.2px solid #414141',
          outline: 'none',
          fontFamily: 'var(--font-inter), sans-serif',
          fontWeight: 700,
          fontSize: '20px',
          letterSpacing: '-0.05em',
          color: '#ffffff',
          caretColor: '#EAEAEA',
          padding: '0 0 4px 0',
        }}
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

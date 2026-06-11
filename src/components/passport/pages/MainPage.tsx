'use client'

import { formatPassportNumber } from '@/lib/passport/identifier'
import { generateCardMRZ } from '@/lib/passport/mrz'
import { DEFAULT_THEME, type ThemeConfig } from '@/lib/passport/theme'

type Props = {
  userId: number
  nick?: string | null
  firstName?: string | null
  lastName?: string | null
  gender?: string | null
  birthDate?: string | null
  city?: string | null
  theme?: string | null
  themeConfig?: ThemeConfig
  avatarUrl?: string | null
  signatureSvg?: string | null
  registeredAt?: string | null
  badges?: string[]
  onBadgesClick?: () => void
}

// Card geometry (within the 430×932 ResponsiveStage). 4px screen margins.
const CARD_W = 422
const CARD_H = 760
const CARD_TOP = 10
const CARD_LEFT = 4
const PAD = 26
const PHOTO_W = 168
const PHOTO_H = Math.round((PHOTO_W * 430) / 320) // ≈ 226

// Цвета берутся из CSS-переменных, которые задаёт корень карточки (тема)
const C_LABEL = 'var(--pc-label)'
const C_VALUE = 'var(--pc-text)'

const GENDER_LABELS: Record<string, string> = { М: 'мужской', Ж: 'женский', Щ: 'щёлочь' }

function fmtBirth(iso?: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y}`
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-inter), sans-serif',
        fontWeight: 500,
        fontSize: '10px',
        color: C_LABEL,
        letterSpacing: '-0.02em',
        display: 'block',
        lineHeight: 1.2,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

function Value({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-inter), sans-serif',
        fontWeight: 800,
        fontSize: '17px',
        color: C_VALUE,
        letterSpacing: '-0.03em',
        display: 'block',
        lineHeight: 1.15,
        // never wrap — keeps every row a predictable height so nothing collides
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

function prepareSignatureSvg(svg: string): string {
  return svg
    .replace(/stroke="white"/g, 'stroke="#1a1a1a"')
    .replace(/stroke="#fff(?:fff)?"/gi, 'stroke="#1a1a1a"')
    .replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1 width="100%"')
    .replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1 height="100%"')
}

export function MainPage({
  userId, nick, firstName, lastName, gender, birthDate, city, theme,
  themeConfig, avatarUrl, signatureSvg, registeredAt, badges = [], onBadgesClick,
}: Props) {
  const t = themeConfig ?? DEFAULT_THEME
  const num = formatPassportNumber(userId, registeredAt)
  const mrz = generateCardMRZ({ nick, lastName, firstName, city, birthDate, number: userId, prefix: t.mrz_prefix })

  const rightX = PAD + PHOTO_W + 16
  const rightW = CARD_W - PAD - rightX

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Card */}
      <div
        style={{
          position: 'absolute',
          top: `${CARD_TOP}px`,
          left: `${CARD_LEFT}px`,
          width: `${CARD_W}px`,
          height: `${CARD_H}px`,
          background: t.colors.card_bg,
          borderRadius: '28px',
          overflow: 'hidden',
          '--pc-label': t.colors.label,
          '--pc-text': t.colors.text,
        } as React.CSSProperties}
      >
        {/* Watermark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={t.watermark_main}
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '110px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '92%',
            filter: 'brightness(0) opacity(0.06)',
            pointerEvents: 'none',
          }}
        />

        {/* Photo */}
        <div
          style={{
            position: 'absolute',
            top: `${PAD}px`,
            left: `${PAD}px`,
            width: `${PHOTO_W}px`,
            height: `${PHOTO_H}px`,
            borderRadius: '10px',
            overflow: 'hidden',
            background: '#bcbcbc',
          }}
        >
          {avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Фото"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>

        {/* Red passport number — top-right */}
        <div
          style={{
            position: 'absolute',
            top: `${PAD}px`,
            right: `${PAD}px`,
            textAlign: 'right',
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: '24px',
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            color: t.colors.accent,
          }}
        >
          <div>{num.top}</div>
          <div>{num.bottom}</div>
        </div>

        {/* Right column fields */}
        <div style={{ position: 'absolute', top: `${PAD + 44}px`, left: `${rightX}px`, width: `${rightW}px` }}>
          <Label>ник</Label>
          <Value>{nick || '—'}</Value>

          <div style={{ height: '10px' }} />
          <Label>имя</Label>
          <Value>{firstName || '—'}</Value>

          <div style={{ height: '10px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Label>фамилия</Label>
              <Value>{lastName || '—'}</Value>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Label>пол</Label>
              <Value>{gender ? (GENDER_LABELS[gender] ?? gender) : '—'}</Value>
            </div>
          </div>

          <div style={{ height: '10px' }} />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Label>дата рождения</Label>
              <Value style={{ fontSize: '15px' }}>{fmtBirth(birthDate)}</Value>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Label>подпись</Label>
              <div style={{ height: '26px', borderBottom: `1px solid ${t.colors.border}`, position: 'relative' }}>
                {signatureSvg && (
                  <div
                    style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
                    dangerouslySetInnerHTML={{ __html: prepareSignatureSvg(signatureSvg) }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Middle band — выдан / тема / дата выдачи */}
        <div style={{ position: 'absolute', top: `${PAD + PHOTO_H + 28}px`, left: `${PAD}px`, width: `${CARD_W - PAD * 2}px` }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Label>выдан</Label>
              <Value style={{ fontSize: '19px' }}>{t.issuer}</Value>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Label>тема</Label>
              <Value style={{ fontSize: '19px' }}>{theme || 'Цифровой эскапизм'}</Value>
            </div>
          </div>
          <div style={{ height: '14px' }} />
          <Label>дата выдачи</Label>
          <Value style={{ fontSize: '19px' }}>{t.issue_date}</Value>
        </div>

        {/* Skill badges area — tappable */}
        <button
          onClick={onBadgesClick}
          style={{
            position: 'absolute',
            top: `${PAD + PHOTO_H + 130}px`,
            left: `${PAD}px`,
            width: `${CARD_W - PAD * 2}px`,
            height: '300px',
            border: `2px dashed ${t.colors.border}`,
            borderRadius: '16px',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
          }}
        >
          {badges.length === 0 ? (
            <span style={{ fontSize: '40px', fontWeight: 300, color: '#7a7a7a', lineHeight: 1 }}>+</span>
          ) : (
            badges.map((b) => (
              <span
                key={b}
                style={{
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontWeight: 700,
                  fontSize: '13px',
                  letterSpacing: '-0.03em',
                  color: t.colors.text,
                  background: t.colors.badge_bg,
                  borderRadius: '999px',
                  padding: '6px 12px',
                }}
              >
                {b}
              </span>
            ))
          )}
        </button>

        {/* MRZ strip */}
        <div style={{ position: 'absolute', bottom: '16px', left: `${PAD}px`, width: `${CARD_W - PAD * 2}px` }}>
          {mrz.map((line, i) => (
            <div
              key={i}
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '8px',
                letterSpacing: '0.18em',
                color: t.colors.border,
                lineHeight: 1.5,
                textAlign: i === 2 ? 'center' : 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

/**
 * Полноширинная нижняя кнопка из прототипа: fixed bottom, градиент-подложка,
 * скрывается вниз при открытой клавиатуре (hidden).
 */
export function MainButtonBar({
  children,
  onClick,
  disabled = false,
  hidden = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  hidden?: boolean
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: '24px 20px max(40px, env(safe-area-inset-bottom))',
        boxSizing: 'border-box',
        zIndex: 150,
        background: 'linear-gradient(to top, rgba(0,0,0,1) 70%, rgba(0,0,0,0))',
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        transform: hidden ? 'translateY(120%)' : 'none',
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? 'none' : 'auto',
      }}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '18px 0',
          backgroundColor: disabled ? '#414141' : '#ffffff',
          color: disabled ? '#747373' : '#000000',
          border: 'none',
          borderRadius: '100px',
          fontFamily: 'var(--font-inter), sans-serif',
          fontSize: '18px',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.3s, color 0.3s',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {children}
      </button>
    </div>
  )
}

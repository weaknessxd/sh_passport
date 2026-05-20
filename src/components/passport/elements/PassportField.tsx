type Props = {
  top: string
  left: string
  align?: 'left' | 'center' | 'right'
  children: React.ReactNode
  className?: string
}

export function PassportField({ top, left, align = 'left', children, className = '' }: Props) {
  const translateX =
    align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0'

  return (
    <div
      className={`absolute ${className}`}
      style={{
        top,
        left,
        transform: `translateX(${translateX})`,
      }}
    >
      {children}
    </div>
  )
}

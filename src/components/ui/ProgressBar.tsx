type Props = {
  /** 0–1 */
  progress: number
}

/**
 * 320×5px progress bar.
 * Background: #414141, fill: white.
 */
export function ProgressBar({ progress }: Props) {
  return (
    <div
      style={{
        width: '320px',
        height: '5px',
        background: '#414141',
        borderRadius: '999px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
          background: '#ffffff',
          borderRadius: '999px',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}

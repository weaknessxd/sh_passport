/** Хаптик-отклик Telegram WebApp (безопасно вне Telegram — no-op). */
export function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  try {
    const tg = (window as unknown as {
      Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred?: (s: string) => void } } }
    }).Telegram
    tg?.WebApp?.HapticFeedback?.impactOccurred?.(style)
  } catch { /* ignore */ }
}

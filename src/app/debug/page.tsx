'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [info, setInfo] = useState<Record<string, string>>({})

  useEffect(() => {
    const tg = (window as unknown as { Telegram?: { WebApp?: Record<string, unknown> } }).Telegram
    const hash = window.location.hash
    const search = window.location.search

    let sdkParams = '(ошибка)'
    try {
      const { retrieveLaunchParams } = require('@telegram-apps/sdk-react')
      const p = retrieveLaunchParams()
      sdkParams = JSON.stringify(p).slice(0, 200)
    } catch (e) {
      sdkParams = String(e)
    }

    setInfo({
      'window.Telegram': tg ? 'есть' : 'нет',
      'location.hash (50 chars)': hash.slice(0, 50) || '(пусто)',
      'location.search': search || '(пусто)',
      'hash length': String(hash.length),
      'SDK retrieveLaunchParams': sdkParams,
      'platform': String(tg?.WebApp?.['platform'] ?? '(нет)'),
      'userAgent': navigator.userAgent.slice(0, 80),
    })
  }, [])

  return (
    <div className="p-4 text-xs font-mono">
      <h1 className="mb-4 text-base font-bold">Debug</h1>
      {Object.entries(info).map(([key, val]) => (
        <div key={key} className="mb-3">
          <span className="text-zinc-400">{key}:</span>
          <br />
          <span className="text-green-400 break-all">{val}</span>
        </div>
      ))}
    </div>
  )
}

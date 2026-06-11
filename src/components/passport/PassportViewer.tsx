'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ResponsiveStage } from '@/components/ui/ResponsiveStage'
import { Button } from '@/components/ui/Button'
import { CameraNavigator } from './CameraNavigator'
import { SkillBadgesModal } from './SkillBadgesModal'
import { MainPage } from './pages/MainPage'
import { StampsPage } from './pages/StampsPage'
import type { ThemeConfig } from '@/lib/passport/theme'

type StampData = {
  id: number
  name: string
  icon?: string | null
  issued_at?: string | null
}

type UserData = {
  id: number
  first_name?: string | null
  last_name?: string | null
  tg_username?: string | null
  gender?: string | null
  birth_date?: string | null
  city?: string | null
  region_issued?: string | null
  theme?: string | null
  avatar_url?: string | null
  signature_svg?: string | null
  skill_badges?: string[]
  registered_at?: string | null
}

type Props = {
  user: UserData
  stamps?: StampData[]
  initData?: string | null
  themeConfig?: ThemeConfig
}

const STAMPS_PER_PAGE = 8
const STAMP_PAGES = 3 // 24 slots

export function PassportViewer({ user, stamps = [], initData, themeConfig }: Props) {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [badges, setBadges] = useState<string[]>(user.skill_badges ?? [])
  const [badgesOpen, setBadgesOpen] = useState(false)

  // page 0 = main, pages 1..STAMP_PAGES = stamps
  const totalPages = 1 + STAMP_PAGES
  const pagesMeta = [
    { label: '' }, // main
    ...Array.from({ length: STAMP_PAGES }, (_, i) => ({ label: String(i + 1) })),
  ]

  async function saveBadges(next: string[]) {
    setBadges(next)
    setBadgesOpen(false)
    if (!initData) return
    try {
      await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, skill_badges: next }),
      })
    } catch {
      /* non-critical */
    }
  }

  function handleShare() {
    const num = String(user.id).padStart(4, '0')
    const text = `Мой паспорт Щёлочь №${num}`
    try {
      const tg = (window as unknown as {
        Telegram?: { WebApp?: { switchInlineQuery?: (q: string) => void; openTelegramLink?: (u: string) => void } }
      }).Telegram
      if (tg?.WebApp?.openTelegramLink) {
        tg.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent('https://t.me/')}&text=${encodeURIComponent(text)}`)
        return
      }
    } catch { /* ignore */ }
    if (navigator.share) {
      void navigator.share({ title: 'Паспорт Щёлочь', text }).catch(() => {})
    }
  }

  function renderPage(index: number) {
    if (index === 0) {
      return (
        <MainPage
          userId={user.id}
          nick={user.tg_username}
          firstName={user.first_name}
          lastName={user.last_name}
          gender={user.gender}
          birthDate={user.birth_date}
          city={user.city ?? user.region_issued}
          theme={user.theme}
          themeConfig={themeConfig}
          avatarUrl={user.avatar_url}
          signatureSvg={user.signature_svg}
          registeredAt={user.registered_at}
          badges={badges}
          onBadgesClick={() => setBadgesOpen(true)}
        />
      )
    }
    return <StampsPage stamps={stamps} pageIndex={index - 1} stampsPerPage={STAMPS_PER_PAGE} themeConfig={themeConfig} />
  }

  return (
    <>
    <ResponsiveStage>
      {/* Pages */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={page}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {renderPage(page)}
        </motion.div>
      </AnimatePresence>

      {/* Action pills — only on main page */}
      {page === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '784px',
            left: 0,
            width: '430px',
            display: 'flex',
            justifyContent: 'center',
            gap: '14px',
          }}
        >
          <Button size="md" onClick={handleShare}>Поделиться</Button>
          <Button size="md" onClick={() => router.push('/settings')}>Редактировать</Button>
        </div>
      )}

      {/* Stamp-claim pill — only on stamp pages */}
      {page > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '784px',
            left: 0,
            width: '430px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Button size="md" onClick={() => router.push('/stamps/claim')}>+ Получить штамп</Button>
        </div>
      )}

      {/* Camera-style navigator */}
      <CameraNavigator pages={pagesMeta} current={page} onSelect={setPage} />
    </ResponsiveStage>

    {/* Skill badges modal — rendered outside the scaled stage so it stays
        fixed to the real viewport (no flicker, true screen margins). */}
    <AnimatePresence>
      {badgesOpen && (
        <SkillBadgesModal
          initial={badges}
          onSave={saveBadges}
          onClose={() => setBadgesOpen(false)}
        />
      )}
    </AnimatePresence>
    </>
  )
}

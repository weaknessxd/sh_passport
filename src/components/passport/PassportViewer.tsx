'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { PageNavigator } from './PageNavigator'
import { CoverPage } from './pages/CoverPage'
import { MainPage } from './pages/MainPage'
import { StampsPage } from './pages/StampsPage'
import { FinalPage } from './pages/FinalPage'
import { formatINV } from '@/lib/passport/identifier'

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
  avatar_url?: string | null
  registered_at?: string
}

type Props = {
  user: UserData
  stamps?: StampData[]
  seriesCode?: string
  totalPages?: number
}

const STAMPS_PER_PAGE = 6
const STAMPS_PAGE_START = 3  // страницы 3–12 под штампы (10 страниц = 60 слотов)
const STAMPS_PAGE_COUNT = 10

export function PassportViewer({
  user,
  stamps = [],
  seriesCode = 'FB25',
  totalPages = 16,
}: Props) {
  const [page, setPage] = useState(0)
  const [direction, setDirection] = useState(1)

  const inv = formatINV(user.id, seriesCode)

  function goTo(next: number) {
    setDirection(next > page ? 1 : -1)
    setPage(next)
  }

  function renderPage(index: number) {
    if (index === 0) {
      return <CoverPage inv={inv} seriesCode={seriesCode} />
    }
    if (index === 1 || index === 2) {
      return (
        <MainPage
          inv={inv}
          firstName={user.first_name}
          lastName={user.last_name}
          username={user.tg_username}
          avatarUrl={user.avatar_url}
          registeredAt={user.registered_at}
        />
      )
    }
    if (index >= STAMPS_PAGE_START && index < STAMPS_PAGE_START + STAMPS_PAGE_COUNT) {
      const stampPageIndex = index - STAMPS_PAGE_START
      return (
        <StampsPage
          stamps={stamps}
          pageIndex={stampPageIndex}
          stampsPerPage={STAMPS_PER_PAGE}
        />
      )
    }
    if (index === totalPages - 1) {
      return <FinalPage inv={inv} />
    }

    // Заглушка для остальных страниц
    return (
      <div className="relative h-full w-full bg-[#0c0c18] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-600 text-sm">Страница {index + 1}</p>
          <p className="text-zinc-800 text-xs mt-1">В разработке</p>
        </div>
        <div className="absolute top-2 right-2 rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
          PLACEHOLDER
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black select-none">
      {/* Паспорт */}
      <div className="relative flex-1 overflow-hidden mx-4 mt-4 rounded-2xl border border-zinc-800">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            {renderPage(page)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Кнопка получения штампа на страницах со штампами */}
      {page >= STAMPS_PAGE_START && page < STAMPS_PAGE_START + STAMPS_PAGE_COUNT && (
        <div className="px-4 pt-2">
          <Link
            href="/stamps/claim"
            className="block w-full rounded-lg border border-[#e94560] py-2 text-center text-sm font-medium text-[#e94560] active:bg-[#e94560]/10"
          >
            + Получить штамп
          </Link>
        </div>
      )}

      {/* Навигация */}
      <div className="mb-2">
        <PageNavigator
          current={page}
          total={totalPages}
          onPrev={() => goTo(page - 1)}
          onNext={() => goTo(page + 1)}
        />
        <p className="text-center text-xs text-zinc-600 pb-1">
          {page + 1} / {totalPages}
        </p>
      </div>
    </div>
  )
}

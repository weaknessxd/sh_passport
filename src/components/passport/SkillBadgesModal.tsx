'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

const ALL_SKILLS = [
  'Граф дизайн', 'Постеры', '3D', 'Figma', 'Blender', 'Front-end',
  'Иллюстрация', 'Анимация', 'UI/UX', 'Фотография', 'Видеомонтаж',
  'Музыка', 'Копирайтинг', 'Брендинг', 'Моушн', 'Backend',
]

const MAX_BADGES = 6

type Props = {
  initial: string[]
  onSave: (badges: string[]) => void
  onClose: () => void
}

export function SkillBadgesModal({ initial, onSave, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>(initial)

  function toggle(skill: string) {
    setSelected((prev) => {
      if (prev.includes(skill)) return prev.filter((s) => s !== skill)
      if (prev.length >= MAX_BADGES) return prev
      return [...prev, skill]
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '0 15px',
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#D9D9D9',
          borderRadius: '24px',
          padding: '26px 22px 28px',
        }}
      >
        <p style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.04em', color: '#111', marginBottom: '4px' }}>
          Твои навыки
        </p>
        <p style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 500, fontSize: '13px', color: '#7a7a7a', marginBottom: '18px' }}>
          Выбери до {MAX_BADGES} ({selected.length}/{MAX_BADGES})
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
          {ALL_SKILLS.map((skill) => {
            const active = selected.includes(skill)
            return (
              <button
                key={skill}
                onClick={() => toggle(skill)}
                style={{
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  letterSpacing: '-0.03em',
                  color: active ? '#fff' : '#111',
                  background: active ? '#111' : '#c4c4c4',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {skill}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button onClick={() => onSave(selected)}>Готово</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

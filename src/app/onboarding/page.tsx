'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useTMAUser } from '@/lib/telegram/sdk-provider'
import { MainButtonBar } from '@/components/ui/MainButton'
import { GenderSheet } from '@/components/onboarding/GenderSheet'
import { WarningModal } from '@/components/onboarding/WarningModal'
import { PhotoZone, type PhotoZoneHandle } from '@/components/onboarding/PhotoZone'
import { SignatureScreen } from '@/components/onboarding/SignatureScreen'
import { formatPassportNumber } from '@/lib/passport/identifier'
import { generateCardMRZ } from '@/lib/passport/mrz'
import { DEFAULT_THEME, type ThemeConfig } from '@/lib/passport/theme'
import { haptic } from '@/lib/telegram/haptics'

type Step =
  | 'welcome'
  | 'info'
  | 'photo'
  | 'processing'
  | 'preview'
  | 'rotate'
  | 'signature'
  | 'rotateBack'
  | 'cover'

// Ширина прогресс-бара по шагам (как в прототипе)
const PROGRESS: Partial<Record<Step, string>> = {
  info: '16.6%',
  photo: '33.3%',
  processing: '66.6%',
  preview: '80%',
}

const TITLES: Partial<Record<Step, string>> = {
  info: 'Расскажи о себе',
  photo: 'Загрузи фото',
  processing: 'Обработка фото',
  preview: 'Предпросмотр фото',
}

const EASE = [0.16, 1, 0.3, 1] as const

function isDesktopClient(): boolean {
  try {
    const tg = (window as unknown as { Telegram?: { WebApp?: { platform?: string } } }).Telegram
    const p = tg?.WebApp?.platform ?? ''
    if (p === 'tdesktop' || p === 'weba' || p === 'webk' || p === 'web' || p === 'macos') return true
  } catch { /* ignore */ }
  return typeof window !== 'undefined' && !('ontouchstart' in window)
}

export default function OnboardingPage() {
  const { user, initData, setUser } = useTMAUser()
  const router = useRouter()

  const [step, setStep] = useState<Step>('welcome')
  const [form, setForm] = useState({ first_name: '', last_name: '', gender: '', dob: '', city: '' })
  const [hasPhoto, setHasPhoto] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [recreatesLeft, setRecreatesLeft] = useState(2)
  const [genderOpen, setGenderOpen] = useState(false)
  const [warningOpen, setWarningOpen] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [rotateFallback, setRotateFallback] = useState(false)
  const [coverLeaving, setCoverLeaving] = useState(false)
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME)

  const photoRef = useRef<PhotoZoneHandle>(null)
  const stepRef = useRef(step)
  stepRef.current = step

  // ── Активная тема (фон, цвета кнопок, svg-элементы) ──
  useEffect(() => {
    fetch('/api/theme')
      .then((r) => r.json())
      .then((data: { theme_config?: ThemeConfig }) => {
        if (data.theme_config) setTheme(data.theme_config)
      })
      .catch(() => { /* остаёмся на дефолте */ })
  }, [])

  // ── Блокируем скролл документа + прячем кнопку при клавиатуре ──
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevH = html.style.overflow
    const prevB = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    function onFocusIn(e: FocusEvent) {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') {
        setKeyboardOpen(true)
        setTimeout(() => { window.scrollTo(0, 0); document.body.scrollTop = 0 }, 10)
      }
    }
    function onFocusOut() {
      setTimeout(() => {
        if (document.activeElement?.tagName !== 'INPUT') setKeyboardOpen(false)
      }, 50)
    }
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      html.style.overflow = prevH
      body.style.overflow = prevB
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  // ── Ориентация: rotate → signature, rotateBack → cover ──
  useEffect(() => {
    function check() {
      const landscape = window.innerWidth > window.innerHeight
      if (stepRef.current === 'rotate' && landscape) setStep('signature')
      if (stepRef.current === 'rotateBack' && !landscape) setStep('cover')
    }
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  // ── Fallback-кнопка на шагах поворота (5 секунд) ──
  useEffect(() => {
    setRotateFallback(false)
    if (step === 'rotate' || step === 'rotateBack') {
      const t = setTimeout(() => setRotateFallback(true), 5000)
      return () => clearTimeout(t)
    }
  }, [step])

  // ── Валидация формы ──
  const dobValid = (() => {
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(form.dob)
    if (!m) return false
    const dd = Number(m[1]), mm = Number(m[2]), yyyy = Number(m[3])
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false
    if (yyyy < 1900 || yyyy > new Date().getFullYear()) return false
    const d = new Date(yyyy, mm - 1, dd)
    return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd
  })()
  const infoValid =
    form.first_name.trim() !== '' && form.last_name.trim() !== '' &&
    form.gender !== '' && dobValid && form.city.trim() !== ''

  function setField(field: keyof typeof form) {
    return (v: string) => setForm((p) => ({ ...p, [field]: v }))
  }

  function maskDob(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 8)
    let out = d.slice(0, 2)
    if (d.length > 2) out += '.' + d.slice(2, 4)
    if (d.length > 4) out += '.' + d.slice(4, 8)
    return out
  }

  // ── Сохранение профиля ──
  async function saveAll(signatureSvg: string) {
    if (!initData) return
    const [dd, mm, yyyy] = form.dob.split('.')
    const fields: Record<string, unknown> = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      gender: form.gender,
      birth_date: `${yyyy}-${mm}-${dd}`,
      city: form.city.trim(),
      signature_svg: signatureSvg,
      onboarded: true,
    }
    if (photoUrl) fields.avatar_url = photoUrl
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, ...fields }),
      })
      const json = (await res.json()) as { user?: Parameters<typeof setUser>[0] }
      if (json.user) setUser(json.user)
    } catch (e) {
      console.error('Save failed:', e)
    }
  }

  // ── Переходы ──
  function handleMainButton() {
    haptic('medium')
    if (step === 'welcome') setStep('info')
    else if (step === 'info') setStep('photo')
    else if (step === 'photo') {
      const url = photoRef.current?.crop() ?? null
      setPhotoUrl(url)
      setStep('processing')
      setTimeout(() => { if (stepRef.current === 'processing') setStep('preview') }, 3000)
    } else if (step === 'preview') {
      if (isDesktopClient()) setStep('signature')
      else setStep('rotate')
    } else if (step === 'rotate') {
      setStep('signature') // bypass по fallback-кнопке
    } else if (step === 'rotateBack') {
      setStep('cover')
    }
  }

  async function handleSignatureDone(svg: string) {
    void saveAll(svg)
    const landscape = window.innerWidth > window.innerHeight
    if (!isDesktopClient() && landscape) setStep('rotateBack')
    else setStep('cover')
  }

  function handleGetPassport() {
    haptic('medium')
    setCoverLeaving(true)
    setTimeout(() => router.replace('/passport'), 650)
  }

  function confirmRecreate() {
    setWarningOpen(false)
    setRecreatesLeft((n) => Math.max(0, n - 1))
    setHasPhoto(false)
    setPhotoUrl(null)
    setStep('photo')
  }

  // ── Данные для превью ──
  const serial = formatPassportNumber(user?.id ?? 0, user ? undefined : null)
  const mrz = user
    ? generateCardMRZ({
        nick: user.tg_username,
        lastName: form.last_name,
        firstName: form.first_name,
        city: form.city,
        birthDate: dobValid ? form.dob.split('.').reverse().join('-') : null,
        number: user.id,
      })
    : null

  const headerVisible = step === 'info' || step === 'photo' || step === 'processing' || step === 'preview'
  const backVisible = step === 'photo' || step === 'preview'
  const buttonConfig: { text: string; disabled: boolean; hidden: boolean } = (() => {
    switch (step) {
      case 'welcome': return { text: 'Регистрация', disabled: false, hidden: false }
      case 'info': return { text: 'Продолжить', disabled: !infoValid, hidden: keyboardOpen }
      case 'photo': return { text: 'Продолжить', disabled: !hasPhoto, hidden: false }
      case 'processing': return { text: 'Продолжить', disabled: true, hidden: false }
      case 'preview': return { text: 'Продолжить', disabled: false, hidden: false }
      case 'rotate':
      case 'rotateBack': return { text: 'Продолжить', disabled: false, hidden: !rotateFallback }
      default: return { text: '', disabled: true, hidden: true }
    }
  })()

  function handleBack() {
    haptic('light')
    if (step === 'photo') setStep('info')
    else if (step === 'preview') setStep('photo')
  }

  const ob = theme.onboarding

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden', fontFamily: 'var(--font-inter), sans-serif' }}>
      {/* Фоновое изображение темы (если задано) */}
      {ob.background && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage: `url(${ob.background})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            pointerEvents: 'none',
          }}
        />
      )}
      <style>{`
        @keyframes fadeInBlur {
          0% { opacity: 0; filter: blur(20px); transform: scale(0.95); }
          100% { opacity: 1; filter: blur(0); transform: scale(1); }
        }
        @keyframes rotateSpin { to { transform: rotate(360deg); } }
        @keyframes phoneRotate { 0%, 20% { transform: rotate(0deg); } 80%, 100% { transform: rotate(90deg); } }
        @keyframes phoneRotateBack { 0%, 20% { transform: rotate(90deg); } 80%, 100% { transform: rotate(0deg); } }
        input::placeholder { color: #747373; }
      `}</style>

      {/* ═══ Welcome ═══ */}
      <AnimatePresence>
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            style={{
              position: 'fixed', inset: 0, display: 'flex',
              justifyContent: 'center', alignItems: 'center',
              paddingBottom: '96px', boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                animation: 'fadeInBlur 1.5s ease-out forwards',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ob.logo} alt="Щёлочь" width={125} height={125} style={{ objectFit: 'contain' }} />
              <span style={{
                fontWeight: 900, fontStyle: 'italic', fontSize: '40px',
                letterSpacing: '-0.12em', color: '#fff', lineHeight: 1, textTransform: 'uppercase',
              }}>
                паспорт
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Регистрация: header + контент ═══ */}
      {headerVisible && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column',
          padding: 'max(40px, env(safe-area-inset-top)) 20px 100px',
          boxSizing: 'border-box', overflow: 'hidden',
        }}>
          {/* Прогресс */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{ width: '100%', height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}
          >
            <div style={{
              width: PROGRESS[step] ?? '16.6%', height: '100%',
              background: '#fff', borderRadius: '2px',
              transition: `width 0.5s cubic-bezier(${EASE.join(',')})`,
            }} />
          </motion.div>

          {/* Заголовок + назад */}
          <div style={{ position: 'relative', marginTop: '12px', marginBottom: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, minHeight: '28px' }}>
            <button
              onClick={handleBack}
              style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                fontSize: '24px', color: '#fff', background: 'transparent', border: 'none',
                padding: '10px 10px 10px 0', cursor: 'pointer',
                opacity: backVisible ? 1 : 0, pointerEvents: backVisible ? 'auto' : 'none',
                transition: 'opacity 0.3s', WebkitTapHighlightColor: 'transparent', lineHeight: 1,
              }}
              aria-label="Назад"
            >
              ‹
            </button>
            <AnimatePresence mode="wait">
              <motion.span
                key={TITLES[step]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}
              >
                {TITLES[step]}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Контент шага */}
          <div style={{ flexGrow: 1, minHeight: 0, position: 'relative' }}>
            <AnimatePresence mode="wait">
              {step === 'info' && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '0 10px' }}
                >
                  <Inp placeholder="Имя" value={form.first_name} onChange={setField('first_name')} />
                  <Inp placeholder="Фамилия" value={form.last_name} onChange={setField('last_name')} />
                  <Inp placeholder="Пол" value={form.gender} readOnly onClick={() => setGenderOpen(true)} />
                  <Inp placeholder="Дата рождения" value={form.dob} onChange={(v) => setForm((p) => ({ ...p, dob: maskDob(v) }))} inputMode="numeric" />
                  <Inp placeholder="Город" value={form.city} onChange={setField('city')} />
                </motion.div>
              )}

              {step === 'photo' && (
                <motion.div
                  key="photo"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <PhotoZone ref={photoRef} onHasPhoto={setHasPhoto} />
                </motion.div>
              )}

              {step === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
                >
                  <div style={{ animation: 'rotateSpin 2s linear infinite' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ob.spinner} alt="" width={80} height={80} style={{ objectFit: 'contain' }} />
                  </div>
                </motion.div>
              )}

              {step === 'preview' && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <div style={{
                    width: '100%', aspectRatio: '3 / 4', maxHeight: '55vh',
                    borderRadius: '20px', position: 'relative', overflow: 'hidden',
                    backgroundImage: photoUrl ? `url(${photoUrl})` : undefined,
                    backgroundColor: '#111',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }}>
                    {/* Серийник */}
                    <div style={{
                      position: 'absolute', top: '16px', left: '16px',
                      color: '#fff', fontFamily: 'ui-monospace, monospace',
                      fontSize: '13px', letterSpacing: '2px', lineHeight: 1.2,
                      mixBlendMode: 'difference', fontWeight: 700,
                    }}>
                      {serial.top}<br />{serial.bottom}
                    </div>
                    {/* MRZ-плашка */}
                    {mrz && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, width: '100%',
                        background: '#fff', color: '#000', padding: '12px 16px',
                        boxSizing: 'border-box', fontFamily: 'ui-monospace, monospace',
                        fontSize: '10px', fontWeight: 700, lineHeight: 1.4, wordBreak: 'break-all',
                      }}>
                        {mrz[0]}<br />{mrz[1]}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => { if (recreatesLeft > 0) setWarningOpen(true) }}
                    disabled={recreatesLeft <= 0}
                    style={{
                      marginTop: '24px', backgroundColor: '#747373',
                      color: recreatesLeft > 0 ? '#fff' : '#aaa',
                      padding: '12px 28px', borderRadius: '100px',
                      fontSize: '15px', fontWeight: 600, border: 'none',
                      cursor: recreatesLeft > 0 ? 'pointer' : 'not-allowed',
                      WebkitTapHighlightColor: 'transparent',
                      fontFamily: 'var(--font-inter), sans-serif',
                    }}
                  >
                    Пересоздать ({recreatesLeft})
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ═══ Переверни телефон ═══ */}
      <AnimatePresence>
        {(step === 'rotate' || step === 'rotateBack') && (
          <motion.div
            key={step}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed', inset: 0, background: '#000', zIndex: 110,
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '24px',
            }}
          >
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#fff', textAlign: 'center', lineHeight: 1.4 }}>
              {step === 'rotate' ? 'Переверни телефон' : <>Отлично!<br />Верни телефон вертикально</>}
            </span>
            <div style={{
              width: '120px', height: '120px', border: '2px solid #fff', borderRadius: '24px',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              animation: `${step === 'rotate' ? 'phoneRotate' : 'phoneRotateBack'} 2.5s ease-in-out infinite alternate`,
            }}>
              {ob.rotate_icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ob.rotate_icon} alt="" width={50} height={50} style={{ objectFit: 'contain' }} />
              ) : (
                <svg viewBox="0 0 24 24" width="50" height="50" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Роспись ═══ */}
      <AnimatePresence>
        {step === 'signature' && (
          <motion.div key="signature" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <SignatureScreen onDone={handleSignatureDone} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Обложка: ТВОЙ ПАСПОРТ ГОТОВ ═══ */}
      <AnimatePresence>
        {step === 'cover' && (
          <motion.div
            key="cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: coverLeaving ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'fixed', inset: 0, background: '#000', zIndex: 101,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '20px', paddingBottom: 'max(120px, env(safe-area-inset-bottom))',
              boxSizing: 'border-box', perspective: '1000px',
            }}
          >
            <div style={{
              fontSize: '32px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase',
              marginBottom: '40px', textAlign: 'center', lineHeight: 1.05, color: '#fff',
              letterSpacing: '-0.04em', wordSpacing: '0.3em',
            }}>
              ТВОЙ ПАСПОРТ<br />ГОТОВ
            </div>
            <div style={{
              width: '100%', maxWidth: '340px', aspectRatio: '3 / 4', maxHeight: '55vh',
              backgroundColor: '#d9d9d9', borderRadius: '20px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              transformStyle: 'preserve-3d',
              transform: coverLeaving ? 'scale(1.1) rotateY(-90deg)' : 'none',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ob.logo} alt="" width={80} height={80}
                style={{ filter: 'brightness(0)', opacity: 0.45, marginBottom: '16px', objectFit: 'contain' }}
              />
              <span style={{ fontSize: '24px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#747373' }}>
                ЩЁЛОЧЬ
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Нижняя кнопка ═══ */}
      {step !== 'signature' && step !== 'cover' && (
        <MainButtonBar
          onClick={handleMainButton}
          disabled={buttonConfig.disabled}
          hidden={buttonConfig.hidden}
          bg={ob.button_bg}
          textColor={ob.button_text}
        >
          {buttonConfig.text}
        </MainButtonBar>
      )}
      {step === 'cover' && (
        <MainButtonBar onClick={handleGetPassport} hidden={coverLeaving} bg={ob.button_bg} textColor={ob.button_text}>
          Получить
        </MainButtonBar>
      )}

      {/* ═══ Шторка пола + модалка пересоздания ═══ */}
      <GenderSheet
        open={genderOpen}
        onSelect={(v) => { setForm((p) => ({ ...p, gender: v })); setGenderOpen(false) }}
        onClose={() => setGenderOpen(false)}
      />
      <WarningModal
        open={warningOpen}
        attemptsLeft={recreatesLeft}
        onConfirm={confirmRecreate}
        onClose={() => setWarningOpen(false)}
      />
    </div>
  )
}

// ── Инпут из прототипа: без рамок, 22px/600 ──
function Inp({
  placeholder, value, onChange, readOnly = false, onClick, inputMode,
}: {
  placeholder: string
  value: string
  onChange?: (v: string) => void
  readOnly?: boolean
  onClick?: () => void
  inputMode?: 'numeric'
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      onClick={onClick}
      placeholder={placeholder}
      inputMode={inputMode}
      enterKeyHint="done"
      style={{
        width: '100%',
        background: 'transparent',
        border: 'none',
        color: '#ffffff',
        fontSize: '22px',
        fontWeight: 600,
        outline: 'none',
        padding: 0,
        letterSpacing: '-0.02em',
        WebkitAppearance: 'none',
        fontFamily: 'var(--font-inter), sans-serif',
        caretColor: '#EAEAEA',
        cursor: readOnly ? 'pointer' : 'text',
      }}
    />
  )
}

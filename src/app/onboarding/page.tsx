'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { useTMAUser } from '@/lib/telegram/sdk-provider'
import { ResponsiveStage } from '@/components/ui/ResponsiveStage'
import { StartScreen } from '@/components/onboarding/StartScreen'
import { InfoScreen } from '@/components/onboarding/InfoScreen'
import { PhotoScreen } from '@/components/onboarding/PhotoScreen'
import { SignatureScreen } from '@/components/onboarding/SignatureScreen'
import { FinalScreen } from '@/components/onboarding/FinalScreen'

type Step = 'start' | 'info' | 'photo' | 'signature' | 'final'

const PROGRESS: Record<Step, number> = {
  start: 0,
  info: 1 / 3,
  photo: 2 / 3,
  signature: 1,
  final: 1,
}

export default function OnboardingPage() {
  const { initData, setUser } = useTMAUser()
  const router = useRouter()
  const [step, setStep] = useState<Step>('start')

  // Accumulated form data — saved batch at the end
  const [savedInfo, setSavedInfo] = useState<{
    first_name: string
    last_name: string
    gender: string
    birth_date: string
    city: string
  } | null>(null)
  const [savedPhoto, setSavedPhoto] = useState<string | null>(null)

  async function save(fields: Record<string, string>) {
    if (!initData) throw new Error('No initData')
    const res = await fetch('/api/user/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, ...fields }),
    })
    const json = (await res.json()) as { ok?: boolean; user?: Parameters<typeof setUser>[0]; error?: string }
    if (!res.ok) throw new Error(json.error ?? `Ошибка ${res.status}`)
    if (json.user) setUser(json.user)
  }

  // ─── Handlers ────────────────────────────────────────────────────────────

  function handleStart() {
    setStep('info')
  }

  async function handleInfo(data: {
    first_name: string
    last_name: string
    gender: 'М' | 'Ж' | 'Щ' | ''
    birth_date: string
    city: string
  }) {
    setSavedInfo(data)
    setStep('photo')
  }

  async function handlePhoto(photoDataUrl: string) {
    setSavedPhoto(photoDataUrl)
    setStep('signature')
  }

  async function handleSignature(signatureSvg: string) {
    // Save everything at once here
    try {
      const fields: Record<string, string> = {}
      if (savedInfo) {
        fields.first_name = savedInfo.first_name
        fields.last_name = savedInfo.last_name
        fields.gender = savedInfo.gender
        fields.birth_date = savedInfo.birth_date
        fields.city = savedInfo.city
      }
      if (savedPhoto) fields.avatar_url = savedPhoto
      fields.signature_svg = signatureSvg

      // Email was already saved during previous onboarding entry (not collected here)
      await save(fields)
    } catch (e) {
      console.error('Failed to save onboarding data:', e)
      // Continue anyway — data can be updated in settings
    }
    setStep('final')
  }

  async function handleEnterPassport() {
    // Mark as onboarded — save email step was done earlier
    // If somehow not saved yet, we just navigate
    router.replace('/passport')
  }

  const progress = PROGRESS[step]

  return (
    <>
      {/* Portrait steps — rendered inside a proportionally-scaled stage
          (design reference: iPhone 15 Pro Max 430×932). */}
      {step !== 'signature' && (
        <ResponsiveStage>
          <AnimatePresence mode="wait">
            {step === 'start' && (
              <StartScreen key="start" onRegister={handleStart} />
            )}
            {step === 'info' && (
              <InfoScreen
                key="info"
                onNext={handleInfo}
                onBack={() => setStep('start')}
                progress={progress}
              />
            )}
            {step === 'photo' && (
              <PhotoScreen
                key="photo"
                onNext={handlePhoto}
                onBack={() => setStep('info')}
                progress={progress}
              />
            )}
            {step === 'final' && (
              <FinalScreen key="final" onEnter={handleEnterPassport} />
            )}
          </AnimatePresence>
        </ResponsiveStage>
      )}

      {/* Signature manages its own full-viewport layout (portrait prompt +
          landscape canvas), so it stays outside the portrait stage. */}
      <AnimatePresence>
        {step === 'signature' && (
          <SignatureScreen
            key="signature"
            onNext={handleSignature}
            onBack={() => setStep('photo')}
            progress={progress}
          />
        )}
      </AnimatePresence>
    </>
  )
}

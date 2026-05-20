import { PassportField } from '../elements/PassportField'
import { Avatar } from '../elements/Avatar'
import { generateMRZ } from '@/lib/passport/mrz'

type Props = {
  inv: string
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  avatarUrl?: string | null
  registeredAt?: string
  birthDate?: string | null
}

export function MainPage({ inv, firstName, lastName, username, avatarUrl, registeredAt, birthDate }: Props) {
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || username || 'Участник'
  const [mrzLine1, mrzLine2] = generateMRZ({ lastName, firstName, inv, birthDate })

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a14]" />

      <div className="absolute top-2 right-2 rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
        PLACEHOLDER
      </div>

      {/* Аватар */}
      <PassportField top="10%" left="50%" align="center">
        <Avatar url={avatarUrl} name={fullName} size={88} />
      </PassportField>

      {/* Имя */}
      <PassportField top="38%" left="50%" align="center">
        <p className="text-lg font-semibold text-white">{fullName}</p>
        {username && (
          <p className="text-center text-xs text-zinc-400">@{username}</p>
        )}
      </PassportField>

      {/* Разделитель */}
      <PassportField top="52%" left="8%">
        <div className="h-px w-[84vw] max-w-[320px] bg-zinc-800" />
      </PassportField>

      {/* ИНВ */}
      <PassportField top="56%" left="8%">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">ИНВ</p>
        <p className="font-mono text-xl font-bold tracking-wider text-[#e94560]">{inv}</p>
      </PassportField>

      {/* Дата регистрации */}
      {registeredAt && (
        <PassportField top="72%" left="8%">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Дата регистрации</p>
          <p className="text-sm text-zinc-300">
            {new Date(registeredAt).toLocaleDateString('ru', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        </PassportField>
      )}

      {/* MRZ */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800/60 bg-[#060610] px-3 py-2">
        <p className="font-mono text-[9px] leading-[1.6] tracking-[0.12em] text-zinc-700 break-all">
          {mrzLine1}
        </p>
        <p className="font-mono text-[9px] leading-[1.6] tracking-[0.12em] text-zinc-700 break-all">
          {mrzLine2}
        </p>
      </div>
    </div>
  )
}

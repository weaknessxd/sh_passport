import { PassportField } from '../elements/PassportField'

type Props = {
  inv: string
}

export function FinalPage({ inv }: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-[#0d0d1a]">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, #e94560 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
      </div>

      <div className="absolute top-2 right-2 rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
        PLACEHOLDER
      </div>

      <PassportField top="25%" left="50%" align="center">
        <div className="text-5xl">⚽</div>
      </PassportField>

      <PassportField top="42%" left="50%" align="center">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Ты часть</p>
        <p className="text-xl font-bold tracking-wider text-white">ЩЁЛОЧИ</p>
      </PassportField>

      <PassportField top="58%" left="50%" align="center">
        <p className="font-mono text-sm tracking-widest text-[#e94560]">{inv}</p>
      </PassportField>

      <PassportField top="72%" left="50%" align="center">
        <p className="max-w-[200px] text-center text-xs leading-relaxed text-zinc-500">
          Этот паспорт подтверждает твоё участие в&nbsp;комьюнити&nbsp;Щёлочь
        </p>
      </PassportField>

      <PassportField top="88%" left="50%" align="center">
        <p className="text-[10px] uppercase tracking-widest text-zinc-700">Shchelochi · 2025</p>
      </PassportField>
    </div>
  )
}

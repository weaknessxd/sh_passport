import { PassportField } from '../elements/PassportField'

type Props = {
  inv: string
  seriesCode: string
}

export function CoverPage({ inv, seriesCode }: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Placeholder фон — заменится на PNG */}
      <div className="absolute inset-0 bg-[#0d0d1a]">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e94560 0, #e94560 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }}
        />
      </div>

      {/* Лейбл плейсхолдера */}
      <div className="absolute top-2 right-2 rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
        PLACEHOLDER
      </div>

      {/* Герб / логотип */}
      <PassportField top="15%" left="50%" align="center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#e94560] text-4xl">
          ⚽
        </div>
      </PassportField>

      {/* Название */}
      <PassportField top="38%" left="50%" align="center">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Комьюнити</p>
        <p className="text-2xl font-bold tracking-wider text-white">ЩЁЛОЧЬ</p>
      </PassportField>

      {/* Подзаголовок */}
      <PassportField top="52%" left="50%" align="center">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Цифровой паспорт</p>
        <p className="text-xs tracking-widest text-zinc-600">{seriesCode}</p>
      </PassportField>

      {/* ИНВ снизу */}
      <PassportField top="72%" left="50%" align="center">
        <p className="font-mono text-sm tracking-widest text-[#e94560]">{inv}</p>
      </PassportField>

      {/* Декоративная линия */}
      <PassportField top="82%" left="10%">
        <div className="h-px w-[80vw] max-w-[300px] bg-zinc-800" />
      </PassportField>

      <PassportField top="86%" left="50%" align="center">
        <p className="text-[10px] uppercase tracking-widest text-zinc-700">Shchelochi Community</p>
      </PassportField>
    </div>
  )
}

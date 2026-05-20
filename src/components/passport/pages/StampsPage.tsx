import { Stamp } from '../elements/Stamp'

type StampData = {
  id: number
  name: string
  icon?: string | null
  issued_at?: string | null
}

type Props = {
  stamps: StampData[]
  pageIndex: number // 0-based среди страниц со штампами
  stampsPerPage?: number
}

export function StampsPage({ stamps, pageIndex, stampsPerPage = 6 }: Props) {
  const start = pageIndex * stampsPerPage
  const pageStamps = stamps.slice(start, start + stampsPerPage)

  // Пустые слоты до stampsPerPage
  const slots = Array.from({ length: stampsPerPage }, (_, i) => pageStamps[i] ?? null)

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-[#0b0b16]" />

      <div className="absolute top-2 right-2 rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
        PLACEHOLDER
      </div>

      <div className="absolute top-6 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600">Штампы</p>
      </div>

      <div className="absolute inset-x-0 top-14 bottom-12 grid grid-cols-3 gap-4 px-6 content-start">
        {slots.map((stamp, i) =>
          stamp ? (
            <div key={stamp.id} className="flex justify-center">
              <Stamp
                name={stamp.name}
                icon={stamp.icon ?? undefined}
                issuedAt={stamp.issued_at ?? undefined}
              />
            </div>
          ) : (
            <div key={`empty-${i}`} className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-zinc-800">
                <span className="text-zinc-800 text-lg">+</span>
              </div>
            </div>
          )
        )}
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-[10px] text-zinc-700">
          {stamps.length} из {pageIndex * stampsPerPage + stampsPerPage} слотов заполнено
        </p>
      </div>
    </div>
  )
}

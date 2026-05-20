type Props = {
  name: string
  icon?: string
  issuedAt?: string
}

export function Stamp({ name, icon, issuedAt }: Props) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#e94560] bg-transparent">
        {icon ? (
          <img src={icon} alt={name} className="h-7 w-7 object-contain" />
        ) : (
          <span className="text-xl">★</span>
        )}
      </div>
      <span className="max-w-[64px] text-center text-[10px] leading-tight text-zinc-400">
        {name}
      </span>
      {issuedAt && (
        <span className="text-[9px] text-zinc-600">
          {new Date(issuedAt).toLocaleDateString('ru')}
        </span>
      )}
    </div>
  )
}

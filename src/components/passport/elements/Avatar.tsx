type Props = {
  url?: string | null
  name?: string | null
  size?: number
}

export function Avatar({ url, name, size = 80 }: Props) {
  const initials = name
    ? name.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2)
    : '?'

  if (url) {
    return (
      <img
        src={url}
        alt={name ?? 'avatar'}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-zinc-700 text-white font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  )
}

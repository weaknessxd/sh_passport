export type CardMRZParams = {
  nick?: string | null
  lastName?: string | null
  firstName?: string | null
  city?: string | null
  birthDate?: string | null
  number: number
}

/**
 * Decorative 3-line MRZ strip shown at the bottom of the passport card.
 * Looser than the strict TD3 format — purely cosmetic.
 */
export function generateCardMRZ(p: CardMRZParams): [string, string, string] {
  const nick = toMRZChars((p.nick ?? '') + 'DSGN')
  const last = toMRZChars(p.lastName ?? 'UNKNOWN')
  const first = toMRZChars(p.firstName ?? 'UNKNOWN')
  const city = toMRZChars(p.city ?? '')

  let dob = '000000'
  if (p.birthDate) {
    const [y, m, d] = p.birthDate.split('-')
    dob = `${(y ?? '').slice(2)}${m ?? '00'}${d ?? '00'}`
  }

  const num = String(p.number).padStart(4, '0')

  const line1 = `TM26<${nick}<<${last}<<${first}`
  const line2 = `<<<<${city}<GDETORYADOM<<<<${num}${dob.slice(0, 2)}`
  const line3 = '<'.repeat(28)

  return [line1.slice(0, 44), line2.slice(0, 44), line3]
}

/** Converts a string to MRZ-safe characters (A-Z, 0-9, < as filler). */
function toMRZChars(s: string): string {
  return s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')         // strip diacritics
    .replace(/[ЁА-Я]/g, (c) => CYRILLIC_MAP[c] ?? '<') // transliterate Cyrillic
    .replace(/[^A-Z0-9]/g, '<')              // everything else → filler
}

/** Basic Cyrillic → Latin transliteration (ICAO-style). */
const CYRILLIC_MAP: Record<string, string> = {
  А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'E', Ж: 'ZH',
  З: 'Z', И: 'I', Й: 'I', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O',
  П: 'P', Р: 'R', С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'KH', Ц: 'TS',
  Ч: 'CH', Ш: 'SH', Щ: 'SHCH', Ъ: '', Ы: 'Y', Ь: '', Э: 'E',
  Ю: 'IU', Я: 'IA',
}

/** Compute MRZ check digit (ICAO Doc 9303). */
function checkDigit(input: string): string {
  const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const WEIGHTS = [7, 3, 1] as const
  let sum = 0
  for (let i = 0; i < input.length; i++) {
    const ch = input[i] ?? '<'
    const val = ch === '<' ? 0 : CHARS.indexOf(ch)
    sum += (val < 0 ? 0 : val) * (WEIGHTS[i % 3] ?? 1)
  }
  return String(sum % 10)
}

/** Pad or truncate a string to exactly `len` chars using `<` as filler. */
function pad(s: string, len: number): string {
  return s.padEnd(len, '<').slice(0, len)
}

export type MRZParams = {
  /** Last name (may contain Cyrillic or Latin). */
  lastName?: string | null
  /** First name (may contain Cyrillic or Latin). */
  firstName?: string | null
  /** Formatted INV string, e.g. "FB25-000001". */
  inv: string
  /** ISO date string "YYYY-MM-DD", optional. */
  birthDate?: string | null
  /** Series code, e.g. "FB25". */
  seriesCode?: string
}

/**
 * Returns a two-line MRZ (TD3 layout, 44 chars each) for the passport profile page.
 *
 * Line 1: P<RUS<SURNAME<<GIVENNAME<<<<<<<...
 * Line 2: DOCNUM<CDRUSDOB<CDSEXEXP<CD<<<<<<<<<<<CD
 */
export function generateMRZ(params: MRZParams): [string, string] {
  const surname = toMRZChars(params.lastName ?? 'UNKNOWN')
  const given = toMRZChars(params.firstName ?? 'UNKNOWN')
  const namePart = `${surname}<<${given}`

  // Line 1 — 44 chars
  const line1 = pad(`P<RUS${namePart}`, 44)

  // Document number: INV stripped of non-alnum chars, 9 chars
  const docRaw = params.inv.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  const docNum = pad(docRaw, 9)
  const cd1 = checkDigit(docNum)

  // Date of birth YYMMDD
  let dob = '000000'
  if (params.birthDate) {
    const parts = params.birthDate.split('-')
    const yy = (parts[0] ?? '').slice(2)
    const mm = parts[1] ?? '00'
    const dd = parts[2] ?? '00'
    dob = `${yy}${mm}${dd}`
  }
  const cd2 = checkDigit(dob)

  // Expiry: fixed 2030-01-01
  const exp = '300101'
  const cd3 = checkDigit(exp)

  // Personal number field (15 chars) — use INV padded
  const personal = pad(docRaw, 14)
  const cd4 = checkDigit(personal)

  // Line 2 — 44 chars
  const line2 = pad(`${docNum}${cd1}RUS${dob}${cd2}M${exp}${cd3}${personal}${cd4}`, 44)

  return [line1, line2]
}

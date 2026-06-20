// src/lib/telegram/validate-init-data.ts
//
// Валидация Telegram WebApp initData по официальному алгоритму:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//
// Использование на сервере (никогда не доверять initDataUnsafe с клиента):
//   const validated = validateInitData(initData, process.env.TG_BOT_TOKEN!)
//   const tgUserId = validated.user.id

import crypto from 'node:crypto'

const MAX_AUTH_AGE_SECONDS = 60 * 60 * 24 // 24 часа

export type TelegramUser = {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
  allows_write_to_pm?: boolean
}

export type ValidatedInitData = {
  user: TelegramUser
  auth_date: number
  query_id?: string
  start_param?: string
  chat_type?: string
  chat_instance?: string
}

export class InitDataValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InitDataValidationError'
  }
}

/**
 * Диагностика без выбрасывания ошибок — для отладки «hash mismatch».
 * Секреты не раскрывает: только список ключей, id бота (публичная часть токена
 * до двоеточия) и первые символы хешей.
 */
export function diagnoseInitData(initData: string, botToken: string) {
  // Парсим вручную, чтобы иметь и сырые (encoded), и декодированные значения
  const pairs = initData.split('&').map((p) => {
    const i = p.indexOf('=')
    return { key: p.slice(0, i), raw: p.slice(i + 1) }
  })
  const providedHash = pairs.find((p) => p.key === 'hash')?.raw ?? ''
  const hasSignature = pairs.some((p) => p.key === 'signature')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hmac = (s: string) => crypto.createHmac('sha256', secretKey).update(s).digest('hex')

  // Кандидаты сборки data_check_string
  function build(opts: { decode: boolean; includeSignature: boolean }): string {
    return pairs
      .filter((p) => p.key !== 'hash' && (opts.includeSignature || p.key !== 'signature'))
      .map((p) => ({ key: p.key, value: opts.decode ? decodeURIComponent(p.raw) : p.raw }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((p) => `${p.key}=${p.value}`)
      .join('\n')
  }

  const variants: Record<string, string> = {
    decoded_noSig: build({ decode: true, includeSignature: false }),
    decoded_withSig: build({ decode: true, includeSignature: true }),
    raw_noSig: build({ decode: false, includeSignature: false }),
    raw_withSig: build({ decode: false, includeSignature: true }),
  }

  const matched = Object.entries(variants).find(([, s]) => hmac(s) === providedHash)?.[0] ?? null

  return {
    keys: pairs.map((p) => p.key).sort(),
    hasSignature,
    serverBotId: botToken.split(':')[0],
    providedPrefix: providedHash.slice(0, 12),
    computedPrefix: hmac(variants.decoded_noSig!).slice(0, 12),
    // какой вариант сборки даёт совпадение с подписью Telegram (null = ни один)
    matchedVariant: matched,
  }
}

export function validateInitData(
  initData: string,
  botToken: string,
): ValidatedInitData {
  if (!initData) {
    throw new InitDataValidationError('initData is empty')
  }
  if (!botToken) {
    throw new InitDataValidationError('botToken is not provided')
  }

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) {
    throw new InitDataValidationError('hash is missing')
  }

  // Убираем hash перед сборкой строки для проверки.
  // Также убираем signature — новые клиенты Telegram (Bot API 7.10+) добавляют
  // это поле для сторонней Ed25519-проверки, и его нужно исключать из
  // data_check_string для HMAC-проверки ботовским токеном.
  params.delete('hash')
  params.delete('signature')

  // data_check_string: ключи в алфавитном порядке, "key=value", соединённые \n
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  // secret_key = HMAC_SHA256(bot_token) с ключом "WebAppData"
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest()

  // computed_hash = HMAC_SHA256(data_check_string) с ключом secret_key
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')

  // Сравниваем через timingSafeEqual для защиты от timing attacks
  const computedBuf = Buffer.from(computedHash, 'hex')
  const providedBuf = Buffer.from(hash, 'hex')

  if (
    computedBuf.length !== providedBuf.length ||
    !crypto.timingSafeEqual(computedBuf, providedBuf)
  ) {
    throw new InitDataValidationError('hash mismatch')
  }

  // Проверяем свежесть auth_date
  const authDateRaw = params.get('auth_date')
  const authDate = authDateRaw ? Number(authDateRaw) : NaN
  if (!Number.isFinite(authDate)) {
    throw new InitDataValidationError('auth_date is missing or invalid')
  }
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (nowSeconds - authDate > MAX_AUTH_AGE_SECONDS) {
    throw new InitDataValidationError('auth_date is too old')
  }

  // Парсим пользователя
  const userJson = params.get('user')
  if (!userJson) {
    throw new InitDataValidationError('user data is missing')
  }
  let user: TelegramUser
  try {
    user = JSON.parse(userJson) as TelegramUser
  } catch {
    throw new InitDataValidationError('user data is not valid JSON')
  }
  if (!user.id || typeof user.id !== 'number') {
    throw new InitDataValidationError('user.id is missing or invalid')
  }

  return {
    user,
    auth_date: authDate,
    query_id: params.get('query_id') ?? undefined,
    start_param: params.get('start_param') ?? undefined,
    chat_type: params.get('chat_type') ?? undefined,
    chat_instance: params.get('chat_instance') ?? undefined,
  }
}

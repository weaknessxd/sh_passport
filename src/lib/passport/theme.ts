/**
 * Конфиг темы паспорта. Хранится в presets.config (jsonb).
 * Любое поле опционально — отсутствующие берутся из DEFAULT_THEME.
 */
export type ThemeConfig = {
  colors: {
    /** Фон карточки */
    card_bg: string
    /** Акцент: серийный номер */
    accent: string
    /** Основной текст значений */
    text: string
    /** Подписи полей (ник, имя, ...) */
    label: string
    /** Пунктирные рамки и линии */
    border: string
    /** Фон пилюль скилл-бейджей */
    badge_bg: string
  }
  /** Водяной знак главной страницы */
  watermark_main: string
  /** Водяной знак страниц штампов */
  watermark_stamps: string
  /** Текст «выдан» */
  issuer: string
  /** Дата выдачи на карточке */
  issue_date: string
  /** Префикс MRZ-строки */
  mrz_prefix: string
}

export const DEFAULT_THEME: ThemeConfig = {
  colors: {
    card_bg: '#D9D9D9',
    accent: '#ED1C24',
    text: '#111111',
    label: '#8a8a8a',
    border: '#9a9a9a',
    badge_bg: '#c4c4c4',
  },
  watermark_main: '/icons/bear.svg',
  watermark_stamps: '/icons/creatures.svg',
  issuer: 'ГУ МСД Щёлочь',
  issue_date: '31.12.2999',
  mrz_prefix: 'TM26',
}

/** Сливает частичный конфиг из БД с дефолтом. */
export function resolveTheme(raw: unknown): ThemeConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_THEME
  const cfg = raw as Partial<ThemeConfig> & { colors?: Partial<ThemeConfig['colors']> }
  return {
    colors: { ...DEFAULT_THEME.colors, ...(cfg.colors ?? {}) },
    watermark_main: cfg.watermark_main ?? DEFAULT_THEME.watermark_main,
    watermark_stamps: cfg.watermark_stamps ?? DEFAULT_THEME.watermark_stamps,
    issuer: cfg.issuer ?? DEFAULT_THEME.issuer,
    issue_date: cfg.issue_date ?? DEFAULT_THEME.issue_date,
    mrz_prefix: cfg.mrz_prefix ?? DEFAULT_THEME.mrz_prefix,
  }
}

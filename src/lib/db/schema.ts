import {
  pgSchema,
  serial,
  text,
  bigint,
  timestamp,
  date,
  boolean,
  integer,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core'

const passport = pgSchema('passport')

export const users = passport.table('users', {
  id: serial('id').primaryKey(),
  tg_id: bigint('tg_id', { mode: 'bigint' }).notNull().unique(),
  tg_username: text('tg_username'),
  email: text('email'),
  password_hash: text('password_hash'),
  first_name: text('first_name'),
  last_name: text('last_name'),
  birth_date: date('birth_date'),
  display_name: text('display_name'),
  signature_text: text('signature_text'),
  about_owner: text('about_owner'),
  region_issued: text('region_issued'),
  gender: text('gender'),
  custom_slug: text('custom_slug').unique(),
  avatar_url: text('avatar_url'),
  signature_svg: text('signature_svg'),
  active_preset_id: integer('active_preset_id'),
  privacy_settings: jsonb('privacy_settings').default({}),
  registered_at: timestamp('registered_at', { withTimezone: true }).defaultNow(),
})

export const presets = passport.table('presets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  series_code: text('series_code').notNull(),
  config: jsonb('config').notNull(),
  active_from: date('active_from'),
  active_until: date('active_until'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const userPresets = passport.table(
  'user_presets',
  {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    preset_id: integer('preset_id').references(() => presets.id),
    unlocked_at: timestamp('unlocked_at', { withTimezone: true }).defaultNow(),
    source: text('source').notNull(),
    customizations: jsonb('customizations').default({}),
  },
  (table) => [unique().on(table.user_id, table.preset_id)],
)

export const stampTypes = passport.table('stamp_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  available_from: timestamp('available_from', { withTimezone: true }),
  available_until: timestamp('available_until', { withTimezone: true }),
})

export const stamps = passport.table(
  'stamps',
  {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    stamp_type_id: integer('stamp_type_id').references(() => stampTypes.id),
    source_id: text('source_id'),
    issued_at: timestamp('issued_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.user_id, table.source_id)],
)

export const insalesOrders = passport.table('insales_orders', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  status: text('status').notNull(),
  product_type: text('product_type'),
  course_passed: boolean('course_passed').default(false),
  created_at: timestamp('created_at', { withTimezone: true }),
})

export const userPurchases = passport.table('user_purchases', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  item_id: integer('item_id'),
  purchased_at: timestamp('purchased_at', { withTimezone: true }).defaultNow(),
})

# Паспорт Щёлочь — стартовый промпт для Claude Code

## Контекст продукта

Telegram Mini App «Паспорт Щёлочь» — цифровой паспорт участника комьюнити Щёлочь. У каждого юзера уникальный ИНВ (идентификационный номер владельца) от 1 до миллиона, визуальный пресет (привязан к сезону регистрации), печати за курсы/мерч/ивенты, нейроаватар (в v1 — заглушка).

Сейчас делаем **MVP — сырую технически рабочую версию**. Главное: регистрация, просмотр своего паспорта пролистыванием стрелочками между статичными PNG-фонами с динамическими данными поверх, выдача штампов по номеру заказа InSales.

## Технологический стек

- **Next.js 15** (App Router, TypeScript, Server Actions)
- **Drizzle ORM** + PostgreSQL (schema `passport.*` в общей БД Щёлочи)
- **@telegram-apps/sdk-react** для интеграции с TMA
- **Tailwind CSS** + **shadcn/ui** для UI-скелета (поверх кастомим под пресет)
- **Framer Motion** для базовых анимаций (заделом на полноценное перелистывание в v1.1)
- **zod** для валидации env и форм
- **csv-parse** для импорта InSales
- **pnpm** как пакетный менеджер
- **tsx** для CLI-скриптов

## Структура проекта

```
shchelochi-passport/
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # подключает TMA SDK Provider, тёмная тема
│   │   ├── page.tsx                       # entrypoint, редирект на /onboarding или /passport
│   │   ├── onboarding/
│   │   │   └── page.tsx                   # форма заполнения полей паспорта
│   │   ├── passport/
│   │   │   └── page.tsx                   # просмотр своего паспорта
│   │   ├── stamps/
│   │   │   └── claim/page.tsx             # форма ввода order_id + email
│   │   ├── settings/
│   │   │   └── page.tsx                   # редактирование полей паспорта
│   │   └── api/
│   │       ├── auth/validate/route.ts     # POST: HMAC-валидация initData
│   │       └── stamps/claim/route.ts      # POST: выдача штампа
│   │
│   ├── components/
│   │   ├── passport/
│   │   │   ├── PassportViewer.tsx         # контейнер: PNG-фоны + оверлеи + навигация
│   │   │   ├── PageNavigator.tsx          # стрелочки + индикатор страницы
│   │   │   ├── pages/
│   │   │   │   ├── CoverPage.tsx          # обложка
│   │   │   │   ├── MainPage.tsx           # 2-3: профиль + ИНВ + аватар
│   │   │   │   ├── StampsPage.tsx         # печати
│   │   │   │   ├── FormatPage.tsx         # 14-15: напоминалки + история
│   │   │   │   └── FinalPage.tsx          # 16: финал
│   │   │   └── elements/
│   │   │       ├── PassportField.tsx      # позиционируемое поле (top/left из config)
│   │   │       ├── Avatar.tsx
│   │   │       └── Stamp.tsx
│   │   ├── onboarding/
│   │   │   ├── OnboardingForm.tsx
│   │   │   └── steps/                     # пошаговый flow
│   │   ├── forms/
│   │   └── ui/                            # shadcn-компоненты
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts                  # Drizzle schema (см. ниже)
│   │   │   ├── client.ts                  # postgres-js клиент
│   │   │   └── migrations/                # автогенерится через drizzle-kit
│   │   ├── telegram/
│   │   │   ├── validate-init-data.ts      # ГОТОВ — см. файл validate-init-data.ts
│   │   │   └── sdk-provider.tsx           # React provider для TMA SDK
│   │   ├── passport/
│   │   │   ├── identifier.ts              # формирование ИНВ из id + series_code
│   │   │   ├── mrz.ts                     # генерация MRZ-строки
│   │   │   └── stamps.ts                  # логика выдачи штампов
│   │   └── env.ts                         # zod-валидация process.env
│   │
│   └── server/                            # server actions (если используем)
│
├── public/
│   └── presets/
│       └── football/
│           ├── backgrounds/               # PNG-фоны страниц паспорта
│           ├── stamps/                    # SVG печатей
│           └── config.json                # координаты полей, цвета, шрифты
│
├── scripts/
│   ├── import-insales-orders.ts           # ГОТОВ — см. файл import-insales-orders.ts
│   └── seed-presets.ts                    # сидинг футбольного пресета и типов штампов
│
├── drizzle.config.ts
├── next.config.mjs
├── tailwind.config.ts
├── docker-compose.yml                     # локально: postgres
├── .env.example
├── tsconfig.json
└── package.json
```

## Схема БД (Drizzle)

Создать `src/lib/db/schema.ts` со следующими таблицами:

```typescript
import {
  pgTable,
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

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  tg_id: bigint('tg_id', { mode: 'bigint' }).notNull().unique(),
  tg_username: text('tg_username'),
  email: text('email'),
  first_name: text('first_name'),
  last_name: text('last_name'),
  birth_date: date('birth_date'),
  display_name: text('display_name'),
  signature_text: text('signature_text'),
  about_owner: text('about_owner'),
  region_issued: text('region_issued'),
  custom_slug: text('custom_slug').unique(),
  avatar_url: text('avatar_url'),
  active_preset_id: integer('active_preset_id'),
  privacy_settings: jsonb('privacy_settings').default({}),
  registered_at: timestamp('registered_at', { withTimezone: true }).defaultNow(),
})

export const presets = pgTable('presets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  series_code: text('series_code').notNull(),
  config: jsonb('config').notNull(),
  active_from: date('active_from'),
  active_until: date('active_until'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const userPresets = pgTable(
  'user_presets',
  {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    preset_id: integer('preset_id').references(() => presets.id),
    unlocked_at: timestamp('unlocked_at', { withTimezone: true }).defaultNow(),
    source: text('source').notNull(),
    customizations: jsonb('customizations').default({}),
  },
  (table) => ({
    userPresetUnique: unique().on(table.user_id, table.preset_id),
  }),
)

export const stampTypes = pgTable('stamp_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  available_from: timestamp('available_from', { withTimezone: true }),
  available_until: timestamp('available_until', { withTimezone: true }),
})

export const stamps = pgTable(
  'stamps',
  {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    stamp_type_id: integer('stamp_type_id').references(() => stampTypes.id),
    source_id: text('source_id'),
    issued_at: timestamp('issued_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userSourceUnique: unique().on(table.user_id, table.source_id),
  }),
)

export const insalesOrders = pgTable('insales_orders', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  status: text('status').notNull(),
  product_type: text('product_type'),
  course_passed: boolean('course_passed').default(false),
  created_at: timestamp('created_at', { withTimezone: true }),
})

export const userPurchases = pgTable('user_purchases', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  item_id: integer('item_id'),
  purchased_at: timestamp('purchased_at', { withTimezone: true }).defaultNow(),
})
```

**Важно:** заложить ВСЕ таблицы сразу, даже `user_purchases` и поля типа `custom_slug` — фичи отложены, но миграции переделывать потом дороже.

## Готовый код в репо

В корне проекта уже лежат три готовых файла, которые надо разложить по структуре:

1. **`validate-init-data.ts`** → `src/lib/telegram/validate-init-data.ts`
2. **`auth-validate-route.ts`** → `src/app/api/auth/validate/route.ts`
3. **`import-insales-orders.ts`** → `scripts/import-insales-orders.ts`

Не переписывай эти файлы без необходимости — они проверены и реализуют критичную логику (HMAC-валидация TMA, upsert заказов с защитой `course_passed`).

## Что делаем в текущей итерации (неделя 1)

### Цель: к концу недели TMA открывается в Telegram и регистрирует юзера в БД.

1. **Init проекта**
   - `pnpm create next-app@latest` с TypeScript, App Router, Tailwind
   - Установить зависимости: `drizzle-orm`, `drizzle-kit`, `postgres`, `@telegram-apps/sdk-react`, `zod`, `framer-motion`, `csv-parse`, `tsx`
   - Установить dev-зависимости: `@types/node`
   - Установить shadcn: `pnpm dlx shadcn@latest init` (тёмная тема, no CSS variables — у нас свой стиль)

2. **Env**
   - Создать `src/lib/env.ts` с zod-схемой:
     ```typescript
     import { z } from 'zod'
     const envSchema = z.object({
       DATABASE_URL: z.string().url(),
       TG_BOT_TOKEN: z.string().min(1),
       NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
     })
     export const env = envSchema.parse(process.env)
     ```
   - Создать `.env.example` со списком переменных.

3. **БД**
   - Создать `drizzle.config.ts` указывающий на `src/lib/db/schema.ts`
   - Создать `src/lib/db/client.ts` с postgres-js клиентом
   - Создать `src/lib/db/schema.ts` со всеми таблицами выше
   - `pnpm drizzle-kit generate` → создаст миграцию
   - `pnpm drizzle-kit migrate` → применит к БД
   - **Важно:** все таблицы должны лежать в schema `passport.*`, не в `public`. В Drizzle это делается через `pgSchema('passport')` — см. документацию.

4. **TMA SDK Provider**
   - `src/lib/telegram/sdk-provider.tsx`: React Provider, который при маунте вызывает `init()` из `@telegram-apps/sdk-react`, делает POST на `/api/auth/validate` с `initDataRaw`, складывает результат (user, onboarded) в контекст.
   - Подключить в `src/app/layout.tsx`.
   - Использовать `useTMAUser()` хук во всех компонентах для доступа к юзеру.

5. **Routing**
   - `/` → редирект на `/onboarding` если `!onboarded`, иначе на `/passport`
   - `/onboarding` → форма (пока заглушка с одним полем имени и кнопкой)
   - `/passport` → пока пустой компонент "Привет, {first_name}"

6. **Сидинг**
   - `scripts/seed-presets.ts` — вставляет:
     - Один пресет `football` с `series_code='FB25'` и минимальным config (цвета, путь к фонам)
     - Два типа штампов (например, "Прохождение курса" и "Покупка мерча")
   - Дизайнерские PNG-фоны и SVG-печати пока могут быть плейсхолдерами — кладёшь любой PNG в `public/presets/football/backgrounds/`, заменишь когда дизайн будет готов.

7. **Локальный запуск**
   - `docker-compose.yml` с PostgreSQL 16
   - Для тестов TMA локально: `ngrok http 3000` → URL прописать в @BotFather
   - Документировать в README, как тестировать локально

### К концу недели работает:

- Юзер открывает Mini App в TG → видит онбординг или приветствие.
- В БД создаётся `users` запись с `tg_id` и `tg_username`.
- Базовая навигация между экранами работает.

## Что НЕ делать (важно)

- **Не использовать localStorage/sessionStorage** — Telegram WebApp окружение может вести себя по-разному, всё критичное на сервере.
- **Не доверять `initDataUnsafe`** на клиенте для авторизации — только для UI-подсказок до серверной валидации.
- **Не делать webhook от InSales** — пока ручной CSV-импорт через готовый скрипт.
- **Не делать ЮKassa и платежи** — пока не нужны.
- **Не делать Хромик-интеграцию** — заглушка с дефолтным аватаром.
- **Не делать публичный паспорт `/passport/[id]`** — в TMA-MVP юзер видит только свой паспорт.
- **Не делать админку `/admin/courses`** — `course_passed` пока проставляется через DB-клиент или CSV-импорт.
- **Не пытаться полноценную flip-анимацию перелистывания страниц** — пока стрелочки + смена PNG. Заделом на v1.1 структуру компонентов сделать модульной.
- **Не делать custom slug, тайм-лимитед штампы, color picker, дополнительные пресеты, ранее выданные паспорта** — это backlog v1.x.
- **Не использовать `<form>` без `onSubmit={e => e.preventDefault()}`** — стандартный submit ломает SPA-навигацию.

## Стандарты кода

- TypeScript strict mode, `noUncheckedIndexedAccess: true`
- Все async-функции с error handling — не глотать ошибки
- Server-side validation всех инпутов через zod
- Никаких `any`, никаких `@ts-ignore`
- Imports через `@/...` алиас
- Имена файлов: kebab-case для не-React (`validate-init-data.ts`), PascalCase для компонентов (`PassportViewer.tsx`)
- Названия таблиц БД и полей: snake_case
- Никаких комментариев "// TODO: fix later" без issue в трекере
- Перед коммитом: `pnpm typecheck && pnpm lint`

## Если что-то неясно

Если по ходу работы возникает вопрос про бизнес-логику (что показывать в этом состоянии, какие поля разрешать редактировать, какой формат ИНВ) — **остановись и задай вопрос явно**, а не угадывай. Угадывание стоит дороже, чем уточнение.

Если возникает архитектурный вопрос (как раскладывать состояние, какую либу взять, как организовать слой) — **предложи 2-3 варианта с плюсами/минусами**, не выбирай молча.

## Точка старта

Начни с пункта 1 (Init проекта) из раздела "Что делаем в текущей итерации". После каждого крупного шага (init, env, БД, TMA SDK, routing, сидинг) — отчитайся коротко, что сделано, что не получилось, что нужно от меня.

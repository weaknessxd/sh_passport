# Паспорт Щёлочь

Telegram Mini App — цифровой паспорт участника комьюнити Щёлочь.

## Локальный запуск

### 1. Зависимости

```bash
pnpm install --ignore-scripts
```

### 2. Переменные окружения

```bash
cp .env.example .env.local
# Вставь реальный TG_BOT_TOKEN
```

### 3. База данных (Docker)

```bash
docker-compose up -d
pnpm db:generate
pnpm db:migrate
pnpm seed
```

### 4. Dev-сервер

```bash
pnpm dev
```

### 5. Тестирование в Telegram

```bash
# В другом терминале
ngrok http 3000
# Полученный URL вставить в BotFather → Edit Mini App → Edit Web App URL
```

## Скрипты

| Команда | Описание |
|---|---|
| `pnpm dev` | Dev-сервер |
| `pnpm build` | Production-сборка |
| `pnpm typecheck` | Проверка типов |
| `pnpm db:generate` | Генерация миграций |
| `pnpm db:migrate` | Применить миграции |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm seed` | Сидинг пресетов и типов штампов |
| `pnpm import:orders` | Импорт заказов из CSV |

## Деплой (Netlify)

```bash
netlify deploy --prod
```

Переменные окружения задаются в Netlify Dashboard → Site settings → Environment variables.

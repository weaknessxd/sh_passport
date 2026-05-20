import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  TG_BOT_TOKEN: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = envSchema.parse(process.env)

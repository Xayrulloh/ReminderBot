import 'dotenv/config'
import * as process from 'process'
import * as z from 'zod'
import { Color } from '#utils/enums'

export const schema = z.object({
  NODE_ENV: z.enum(['local', 'dev', 'prod']),
  TOKEN: z.string().regex(/^(\d+):(.*)$/),
  MONGO_URL: z.string(),
  TIME_API: z.string().url(),
  PAYME_URL: z.string().url().optional(),
  PAYME_ENDPOINT: z.string().optional(),
  CARD: z
    .string()
    .regex(/^[0-9]+$/)
    .optional(),
  DISCORD_WEBHOOK_URL: z.string().url(),
  DISCORD_THREAD_ID: z.string().regex(/^[0-9]+$/),
  SESSION_TTL: z.number({ coerce: true }),
  WEBHOOK_URL: z.string().url().optional(),
  WEBHOOK_ENABLED: z.enum(['true', 'false']).transform((v) => JSON.parse(v)),
  WEBHOOK_PORT: z.number({ coerce: true }),
})

type Env = z.infer<typeof schema>

export const result = schema.safeParse(process.env)

if (!result.success) {
  console.error(result.error.issues)
  console.error(Color.Red, 'Some Environment variables are missing. Exiting...')
  process.exit()
}

export const env: Env = result.data

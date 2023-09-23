import 'dotenv/config'
import * as process from 'process'
import * as z from 'zod'
import { Enums } from '#utils/enums'

export const schema = z.object({
  nodeEnv: z.enum(['local', 'dev', 'prod']),
  token: z.string().regex(/^(\d+):(.*)$/),
  mongoUrl: z.string(),
  timeApi: z.string().url(),
  paymeUrl: z.string().url().optional(),
  paymeEndpoint: z.string().optional(),
  card: z.number().optional(),
  discordWebhookUrl: z.string().url(),
  discordThreadId: z.number({ coerce: true }),
  sessionTtl: z.number({ coerce: true }),
  webhookUrl: z.string().url().optional(),
  webhookEnabled: z.enum(['true', 'false']).transform((v) => JSON.parse(v)),
  webhookPort: z.number({ coerce: true }),
  limit: z.number({ coerce: true }),
})

type Env = z.infer<typeof schema>

export const result = schema.safeParse({
  nodeEnv: process.env.NODE_ENV,
  token: process.env.TOKEN,
  mongoUrl: process.env.MONGO_URL,
  timeApi: process.env.TIME_API,
  paymeUrl: process.env.PAYME_URL,
  paymeEndpoint: process.env.PAYME_ENDPOINT,
  card: process.env.CARD,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  discordThreadId: process.env.DISCORD_THREAD_ID,
  sessionTtl: process.env.SESSION_TTL,
  webhookUrl: process.env.WEBHOOK_URL,
  webhookEnabled: process.env.WEBHOOK_ENABLED,
  webhookPort: process.env.WEBHOOK_PORT,
  limit: process.env.LIMIT,
})

if (!result.success) {
  console.error(result.error.issues)
  console.error(Enums.Red, 'Some Environment variables are missing. Exiting...')
  process.exit()
}

export const env: Env = result.data

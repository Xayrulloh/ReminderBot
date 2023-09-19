import { MemorySessionStorage } from 'grammy'

// TTL 1 day
export const memoryStorage = new MemorySessionStorage<any>(24 * 60 * 1000)

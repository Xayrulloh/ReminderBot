import { MemorySessionStorage } from 'grammy'

// TTL 1 day
export const memoryStorage = new MemorySessionStorage<any>(48 * 60 * 1000)

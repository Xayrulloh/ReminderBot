import { MemorySessionStorage } from 'grammy'
import type { IGroup, IUser } from '#types/database'

// TTL 48 hours
export const memoryStorage = new MemorySessionStorage<IUser | IGroup | string>(48 * 60 * 60 * 1000) // 172,800,000 in milliseconds

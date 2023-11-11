import { Context, SessionFlavor } from 'grammy'
import { ScenesFlavor, ScenesSessionData } from 'grammy-scenes'
import { IUser } from '#types/database'

type SessionData = ScenesSessionData & Record<string, any>

export type BotContext = Context &
  SessionFlavor<SessionData> &
  ScenesFlavor & {
    user: IUser
  }

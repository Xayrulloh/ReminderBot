import type { Context, SessionFlavor } from 'grammy'
import type { ScenesFlavor, ScenesSessionData } from 'grammy-scenes'
import type { IGroup, IUser } from '#types/database'

interface AppSessionData {
  currPage: number
  selectedRegionId: number
  hadith: string
  notificationSetting: Record<string, boolean>
  isIndividual: boolean
  toWhom: string
}

type SessionData = ScenesSessionData & AppSessionData

export type BotContext = Context &
  SessionFlavor<SessionData> &
  ScenesFlavor & {
    user: IUser
    group?: IGroup
  }

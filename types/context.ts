import {Context, SessionFlavor} from 'grammy'
import {ScenesFlavor, ScenesSessionFlavor} from 'grammy-scenes'

type SessionData = ScenesSessionFlavor & Record<string, any>

export type BotContext = Context &
    SessionFlavor<SessionData> &
    ScenesFlavor & {
    user: any
}

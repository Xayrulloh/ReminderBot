import { ErrorType } from '#types/error'

export const DAILY_HADITH_KEY = 'dailyHadith'

export const ERROR_MESSAGE: Record<keyof ErrorType, string> = {
  stage: `**Stage:** %s\n`,
  id: `**Id:** \`%s\`\n`,
  name: '**Name:** %s\n',
  firstName: `**FirstName:** %s\n`,
  lastName: `**LastName:** %s\n`,
  username: `**Username:** @%s\n`,
  message: `**Message:** %s\n`,
}

export const FLOOD_MESSAGE: string = `
**Stage**: %s
**Username:** %s
**FirstName:** %s
**LastName:** %s
**Message:** %s
`

export const FEEDBACK_MESSAGE: string = `
**Stage**: %s
**Username:** %s
**FirstName:** %s
**LastName:** %s
**Message:** %s
`

export const PER_PAGE = 12
export const TZ = "Asia/Tashkent"
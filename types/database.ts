import { Document } from 'mongoose'

export interface IUser extends Document {
  userId: number
  userName: string
  name: string
  fasting: boolean
  region: string
  regionId: number
  donate: number
  status: boolean
  notificationSetting: {
    fajr: boolean
    sunrise: boolean
    dhuhr: boolean
    asr: boolean
    maghrib: boolean
    isha: boolean
  }
  deletedAt: Date
}

export interface IHadith extends Document {
  content: string
  category: string
}

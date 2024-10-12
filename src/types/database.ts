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

export interface IPrayTime extends Document {
  region: string
  regionId: number
  day: number
  fajr: string
  sunrise: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
  month: number
}

export interface IHadith extends Document {
  content: string
  category: string
}

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

export interface IQuran extends Document {
  surah: number
  ayah: number
  origin: string
  uzbek: string
}

export interface IGroup extends Document {
  groupId: number
  groupName: string
  region: string
  regionId: number
  status: boolean
  type: string
}

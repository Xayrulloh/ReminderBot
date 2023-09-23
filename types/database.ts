import { Document } from 'mongoose';

export interface IUser extends Document {
  userId: number,
  userName: string,
  name: string,
  notification: boolean,
  fasting: boolean,
  region: string,
  regionId: number,
  donate: number,
  language: string,
  status: boolean,
  notificationSetting: {
    fajr: boolean ,
    sunrise: boolean ,
    dhuhr: boolean ,
    asr: boolean ,
    maghrib: boolean ,
    isha: boolean ,
  },
  deletedAt: Date
}

export interface IPrayTime extends Document {
  region: string,
  regionId: number,
  day: number,
  fajr: string,
  sunrise: string,
  dhuhr: string,
  asr: string,
  maghrib: string,
  isha: string,
}

export interface IHadith extends Document {
  content: string,
  category: string,
}
import mongoose from 'mongoose'
import 'dotenv/config'

const User = new mongoose.Schema(
  {
    userId: {
      required: true,
      type: Number,
    },
    userName: {
      required: false,
      type: String,
    },
    name: {
      required: true,
      type: String,
    },
    notification: {
      required: true,
      type: Boolean,
    },
    fasting: {
      required: true,
      type: Boolean,
    },
    region: {
      required: true,
      type: String,
    },
    regionId: {
      required: true,
      type: Number,
      ref: 'PrayTime',
    },
    donate: {
      required: true,
      type: Number,
    },
    language: {
      required: true,
      type: String,
    },
  },
  { versionKey: false },
)

const PrayTime = new mongoose.Schema(
  {
    region: {
      required: true,
      type: String,
    },
    regionId: {
      required: true,
      type: Number,
    },
    day: {
      required: true,
      type: Number,
    },
    fajr: {
      required: true,
      type: String,
    },
    sunrise: {
      required: true,
      type: String,
    },
    dhuhr: {
      required: true,
      type: String,
    },
    asr: {
      required: true,
      type: String,
    },
    maghrib: {
      required: true,
      type: String,
    },
    isha: {
      required: true,
      type: String,
    },
  },
  { versionKey: false },
)

mongoose.model('User', User)
mongoose.model('PrayTime', PrayTime)
mongoose.set('strictQuery', false)
mongoose.connect(process.env.MONGO_URL)

export default mongoose.models

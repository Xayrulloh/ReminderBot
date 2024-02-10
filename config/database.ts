import mongoose, { Schema } from 'mongoose'
import { IHadith, IPrayTime, IUser } from '#types/database'
import { env } from '#utils/env'
import { Color } from '#utils/enums'

const User = new Schema(
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
    status: {
      default: true,
      type: Boolean,
    },
    notificationSetting: {
      fajr: {
        default: true,
        type: Boolean,
      },
      sunrise: {
        default: true,
        type: Boolean,
      },
      dhuhr: {
        default: true,
        type: Boolean,
      },
      asr: {
        default: true,
        type: Boolean,
      },
      maghrib: {
        default: true,
        type: Boolean,
      },
      isha: {
        default: true,
        type: Boolean,
      },
    },
    deletedAt: {
      type: Date,
      default: null, // Initialize to null when a new document is created
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
    month: {
      required: true,
      type: Number,
      default: 2,
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

const Hadith = new mongoose.Schema(
  {
    content: {
      required: true,
      type: String,
    },
    category: {
      required: false,
      type: String,
    },
  },
  { versionKey: false },
)

mongoose.model<IUser>('User', User)
mongoose.model<IPrayTime>('PrayTime', PrayTime)
mongoose.model<IHadith>('Hadith', Hadith)
mongoose.set('strictQuery', false)

mongoose
  .connect(env.MONGO_URL, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.info('Database successfully connected')
  })
  .catch((reason) => {
    console.error(Color.Red, 'Error with database connection', reason)
    process.exit()
  })

export default mongoose.models

import mongoose, { Schema } from 'mongoose'
import type { IGroup, IHadith, IQuran, IUser } from '#types/database'
import { Color } from '#utils/enums'
import { env } from '#utils/env'

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

const Quran = new mongoose.Schema(
  {
    surah: {
      required: true,
      type: Number,
    },
    ayah: {
      required: true,
      type: Number,
    },
    origin: {
      required: true,
      type: String,
    },
    uzbek: {
      required: true,
      type: String,
    },
  },
  { versionKey: false },
)

const Group = new Schema(
  {
    groupId: {
      required: true,
      type: Number,
    },
    groupName: {
      required: true,
      type: String,
    },
    region: {
      required: true,
      type: String,
    },
    regionId: {
      required: true,
      type: Number,
    },
    status: {
      default: true,
      type: Boolean,
    },
    type: {
      required: true,
      type: String,
    },
  },
  { versionKey: false },
)

mongoose.model<IUser>('User', User)
mongoose.model<IHadith>('Hadith', Hadith)
mongoose.model<IQuran>('Quran', Quran)
mongoose.model<IGroup>('Group', Group)
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
    process.exit(1)
  })

export default mongoose.models

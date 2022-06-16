import mongoose from 'mongoose'

connect()

const Schema = new mongoose.Schema({
    userId: Number,
    notificationAllowed: Boolean,
    location: String
})

async function connect() {
    await mongoose.connect('mongodb://localhost:27017/Namoz')
}

export default mongoose.model('Main', Schema)
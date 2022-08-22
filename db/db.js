import mongoose from "mongoose";
import "dotenv/config";
connect();

const Schema = new mongoose.Schema({
  userId: Number,
  notificationAllowed: Boolean,
  location: String,
  district: String
});

async function connect() {
  await mongoose.connect(process.env.MONGO_URI);
}

export default mongoose.model("Main", Schema);
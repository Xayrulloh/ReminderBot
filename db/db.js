import mongoose from "mongoose";
import "dotenv/config";

const Schema = new mongoose.Schema({
  userId: Number,
  notificationAllowed: Boolean,
  location: String,
  district: String,
});

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URL);

export default mongoose.model("Main", Schema);

import mongoose from "mongoose";

export async function connectDatabase(
  uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/orbit",
) {
  await mongoose.connect(uri);
}

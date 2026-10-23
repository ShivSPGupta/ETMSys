import mongoose from "mongoose";

let cachedPromise = null;

export async function connectDatabase(
  uri = process.env.MONGODB_URI,
) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const targetUri =
    uri || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/orbit";

  cachedPromise = mongoose
    .connect(targetUri, {
      serverSelectionTimeoutMS: 5000,
    })
    .catch((err) => {
      cachedPromise = null;
      throw err;
    });

  return cachedPromise;
}

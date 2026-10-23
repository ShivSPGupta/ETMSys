import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = process.env.PORT || 5000;
try {
  await connectDatabase();
  app.listen(port, () => console.log(`API listening on ${port}`));
} catch (error) {
  console.error("MongoDB connection failed:", error.message);
  process.exit(1);
}

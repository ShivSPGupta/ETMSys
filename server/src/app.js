import express from "express";
import cors from "cors";
import employeeRoutes from "./routes/employeeRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import { connectDatabase } from "./config/database.js";

const app = express();
app.use(cors());
app.use(express.json());

// Fast health-check endpoint (no DB query needed)
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Ensure database connection is established before processing API routes
app.use(async (_req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    console.error("Database connection error:", error.message);
    res.status(500).json({
      message:
        "Database connection failed. Please ensure MONGODB_URI is correctly configured.",
    });
  }
});

app.use("/api/employees", employeeRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use(errorHandler);

export default app;

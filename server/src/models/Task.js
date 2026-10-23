import mongoose from "mongoose";
import { departments } from "./Employee.js";

export const priorities = ["Low", "Medium", "High", "Critical"];
export const taskStatuses = ["Todo", "In Progress", "Completed", "Cancelled"];
export const activeStatuses = ["Todo", "In Progress"];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
    },
    employeeSnapshot: {
      fullName: String,
      employeeId: String,
      email: String,
      department: String,
      role: String,
    },
    department: { type: String, enum: departments, required: true },
    priority: { type: String, enum: priorities, required: true },
    status: { type: String, enum: taskStatuses, default: "Todo" },
    startDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    createdDate: { type: String, required: true },
    completedDate: String,
  },
  { timestamps: true },
);
taskSchema.index({ title: "text" });

export default mongoose.models.Task || mongoose.model("Task", taskSchema);

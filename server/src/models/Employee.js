import mongoose from "mongoose";

export const departments = ["Development", "Design", "QA", "HR", "Sales"];
export const employeeStatuses = ["Active", "Inactive", "On Leave"];

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, trim: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: { type: String, default: "" },
    department: { type: String, enum: departments, required: true },
    role: { type: String, required: true, trim: true },
    joiningDate: { type: String, required: true },
    status: { type: String, enum: employeeStatuses, default: "Active" },
    skills: { type: [String], default: [] },
    leaveStart: String,
    leaveEnd: String,
  },
  { timestamps: true },
);

export default mongoose.models.Employee ||
  mongoose.model("Employee", employeeSchema);

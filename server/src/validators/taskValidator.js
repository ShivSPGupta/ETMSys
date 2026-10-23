import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import { departments } from "../models/Employee.js";
import { priorities } from "../models/Task.js";
import { validDate } from "./employeeValidator.js";

export function validateTask(body) {
  if (
    !body.title ||
    typeof body.title !== "string" ||
    !body.title.trim() ||
    body.title.length > 160
  )
    throw new ApiError(
      400,
      "Task title is required and must be 160 characters or fewer.",
    );
  if (typeof body.description === "string" && body.description.length > 5000)
    throw new ApiError(400, "Description must be 5,000 characters or fewer.");
  if (!body.employeeId || !mongoose.isValidObjectId(body.employeeId))
    throw new ApiError(400, "Choose a valid employee.");
  if (!departments.includes(body.department))
    throw new ApiError(400, "Choose a valid department.");
  if (!priorities.includes(body.priority))
    throw new ApiError(400, "Choose a valid priority.");
  if (!validDate(body.startDate) || !validDate(body.dueDate))
    throw new ApiError(400, "Start date and due date must be valid dates.");
  if (body.dueDate < body.startDate)
    throw new ApiError(400, "Due date cannot be earlier than start date.");
}

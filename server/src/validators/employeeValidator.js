import ApiError from "../utils/ApiError.js";
import { departments, employeeStatuses } from "../models/Employee.js";

export function validateEmployee(body) {
  const required = [
    "employeeId",
    "fullName",
    "email",
    "department",
    "role",
    "joiningDate",
    "status",
  ];
  if (required.some((key) => !body[key]))
    throw new ApiError(
      400,
      "Employee ID, name, email, department, role, joining date, and status are required.",
    );
  if (!/^\S+@\S+\.\S+$/.test(body.email.trim()) || body.email.length > 254)
    throw new ApiError(400, "Enter a valid email address.");
  if (body.phone && !/^\+?[\d\s().-]{7,20}$/.test(body.phone))
    throw new ApiError(400, "Enter a valid phone number.");
  if (!departments.includes(body.department))
    throw new ApiError(400, "Choose a valid department.");
  if (!employeeStatuses.includes(body.status))
    throw new ApiError(400, "Choose a valid employee status.");
  if (!validDate(body.joiningDate))
    throw new ApiError(400, "Enter a valid joining date.");
  if (
    body.status === "On Leave" &&
    (!validDate(body.leaveStart) ||
      !validDate(body.leaveEnd) ||
      body.leaveEnd < body.leaveStart)
  ) {
    throw new ApiError(
      400,
      "On Leave employees need a valid leave start and end date.",
    );
  }
  if (
    body.skills !== undefined &&
    (!Array.isArray(body.skills) ||
      body.skills.some(
        (skill) => typeof skill !== "string" || skill.length > 60,
      ))
  ) {
    throw new ApiError(400, "Skills must be a list of valid text values.");
  }
  if (body.status !== "On Leave") {
    delete body.leaveStart;
    delete body.leaveEnd;
  }
}

export function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}

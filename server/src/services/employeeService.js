import mongoose from "mongoose";
import Employee, { departments, employeeStatuses } from "../models/Employee.js";
import Task, { activeStatuses } from "../models/Task.js";
import ApiError from "../utils/ApiError.js";
import { validateEmployee } from "../validators/employeeValidator.js";

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const requireEmployee = async (id) => {
  if (!mongoose.isValidObjectId(id))
    throw new ApiError(404, "The requested employee was not found.");
  const employee = await Employee.findById(id);
  if (!employee)
    throw new ApiError(404, "The requested employee was not found.");
  return employee;
};
const snapshot = (employee) => ({
  fullName: employee.fullName,
  employeeId: employee.employeeId,
  email: employee.email,
  department: employee.department,
  role: employee.role,
});

export async function listEmployees(query) {
  const page = Number(query.page || 1),
    limit = Number(query.limit || 10);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  )
    throw new ApiError(
      400,
      "Page must be a positive integer and limit must be between 1 and 100.",
    );
  const filter = {};
  if (query.department) {
    if (!departments.includes(query.department))
      throw new ApiError(400, "Invalid department filter.");
    filter.department = query.department;
  }
  if (query.status) {
    if (!employeeStatuses.includes(query.status))
      throw new ApiError(400, "Invalid status filter.");
    filter.status = query.status;
  }
  if (query.search) {
    const match = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ fullName: match }, { employeeId: match }, { email: match }];
  }
  const sortKey = query.sort || "fullName";
  const direction = query.direction === "desc" ? -1 : 1;
  const allowedSorts = [
    "fullName",
    "employeeId",
    "department",
    "role",
    "joiningDate",
    "status",
  ];
  const sortField = allowedSorts.includes(sortKey) ? sortKey : "fullName";

  const [data, total] = await Promise.all([
    Employee.find(filter)
      .sort({ [sortField]: direction, _id: direction })
      .skip((page - 1) * limit)
      .limit(limit),
    Employee.countDocuments(filter),
  ]);
  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}
export async function createEmployee(body) {
  const normalized = {
    ...body,
    email:
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : body.email,
  };
  validateEmployee(normalized);
  const duplicate = await Employee.findOne({
    $or: [
      { employeeId: normalized.employeeId.trim() },
      { email: normalized.email },
    ],
  });
  if (duplicate)
    throw new ApiError(
      409,
      duplicate.employeeId === normalized.employeeId.trim()
        ? "Employee ID already exists."
        : "Email address already exists.",
    );
  return Employee.create(normalized);
}
export async function getEmployee(id) {
  return requireEmployee(id);
}
export async function updateEmployee(id, body) {
  const employee = await requireEmployee(id);
  const normalized = {
    ...body,
    email:
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : body.email,
  };
  validateEmployee(normalized);
  const duplicate = await Employee.findOne({
    $and: [
      { _id: { $ne: employee._id } },
      {
        $or: [
          { employeeId: normalized.employeeId },
          { email: normalized.email },
        ],
      },
    ],
  });
  if (duplicate)
    throw new ApiError(
      409,
      duplicate.employeeId === normalized.employeeId
        ? "Employee ID already exists."
        : "Email address already exists.",
    );
  Object.assign(employee, normalized);
  await employee.save();
  await Task.updateMany(
    { employee: employee._id },
    { $set: { employeeSnapshot: snapshot(employee) } },
  );
  return employee;
}
export async function deleteEmployee(id) {
  const employee = await requireEmployee(id);
  if (
    await Task.exists({
      employee: employee._id,
      status: { $in: activeStatuses },
    })
  )
    throw new ApiError(
      400,
      "This employee has Todo or In Progress tasks. Reassign or finish them before deletion.",
    );
  await Task.updateMany(
    { employee: employee._id },
    { $set: { employeeSnapshot: snapshot(employee) }, $unset: { employee: 1 } },
  );
  await employee.deleteOne();
}

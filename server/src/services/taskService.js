import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import Task, {
  activeStatuses,
  priorities,
  taskStatuses,
} from "../models/Task.js";
import { departments } from "../models/Employee.js";
import ApiError from "../utils/ApiError.js";
import { validateTask } from "../validators/taskValidator.js";
import { validDate } from "../validators/employeeValidator.js";

const snapshot = (employee) => ({
  fullName: employee.fullName,
  employeeId: employee.employeeId,
  email: employee.email,
  department: employee.department,
  role: employee.role,
});
export function taskOutput(task) {
  const value = task.toObject ? task.toObject() : task;
  const employee =
    value.employee && typeof value.employee === "object"
      ? value.employee
      : null;
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue =
    value.status !== "Completed" &&
    value.status !== "Cancelled" &&
    today > value.dueDate;

  return {
    ...value,
    _id: String(value._id),
    taskId: `TSK-${String(value._id).slice(-6).toUpperCase()}`,
    employeeId: employee
      ? String(employee._id)
      : value.employeeSnapshot?.employeeId || String(value.employee || ""),
    assignedEmployeeId: employee ? String(employee._id) : null,
    employeeName:
      employee?.fullName ||
      value.employeeSnapshot?.fullName ||
      "Former employee",
    employeeInitials: (
      employee?.fullName ||
      value.employeeSnapshot?.fullName ||
      "FE"
    )
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
    department: employee?.department || value.department,
    employeeSnapshot: value.employeeSnapshot,
    isOverdue,
    isEmployeeDeleted: !employee && Boolean(value.employeeSnapshot),
  };
}
function parseQuery(query, isExport = false) {
  const page = Number(query.page || 1),
    limit = Number(query.limit || 10),
    filter = {};
  if (
    !isExport &&
    (!Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100)
  )
    throw new ApiError(
      400,
      "Page must be a positive integer and limit must be between 1 and 100.",
    );
  for (const key of ["department", "priority", "status"])
    if (query[key]) {
      const values =
        key === "department"
          ? departments
          : key === "priority"
            ? priorities
            : taskStatuses;
      if (!values.includes(query[key]))
        throw new ApiError(400, `Invalid ${key} filter.`);
      filter[key] = query[key];
    }
  if (query.employee || query.employeeId) {
    const emp = query.employee || query.employeeId;
    if (mongoose.isValidObjectId(emp)) {
      filter.$or = [{ employee: emp }, { "employeeSnapshot.employeeId": emp }];
    } else {
      filter["employeeSnapshot.employeeId"] = emp;
    }
  }
  if (query.dueDate) {
    if (!validDate(query.dueDate))
      throw new ApiError(400, "Due date filter must be a valid date.");
    filter.dueDate = query.dueDate;
  }
  if (query.dueFrom || query.dueTo) {
    if (query.dueFrom && !validDate(query.dueFrom))
      throw new ApiError(400, "Due from must be a valid date.");
    if (query.dueTo && !validDate(query.dueTo))
      throw new ApiError(400, "Due to must be a valid date.");
    if (query.dueFrom && query.dueTo && query.dueFrom > query.dueTo)
      throw new ApiError(400, "Due from cannot be later than due to.");
    filter.dueDate = {
      ...(query.dueFrom ? { $gte: query.dueFrom } : {}),
      ...(query.dueTo ? { $lte: query.dueTo } : {}),
    };
  }
  if (query.search) {
    const match = new RegExp(
      String(query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    filter.$or = [
      { title: match },
      { "employeeSnapshot.fullName": match },
      { "employeeSnapshot.employeeId": match },
    ];
  }
  const sortKey = query.sort || "createdDate",
    direction = query.direction === "asc" ? 1 : -1;
  if (!["createdDate", "dueDate", "priority", "title"].includes(sortKey))
    throw new ApiError(400, "Invalid sort field.");
  return {
    filter,
    page,
    limit,
    sortKey,
    direction,
    sort:
      sortKey === "priority"
        ? { priority: direction, _id: direction }
        : { [sortKey]: direction, _id: direction },
  };
}
async function findTask(id, populate = false) {
  if (!mongoose.isValidObjectId(id))
    throw new ApiError(404, "The requested task was not found.");
  let query = Task.findById(id);
  if (populate) query = query.populate("employee");
  const task = await query;
  if (!task) throw new ApiError(404, "The requested task was not found.");
  return task;
}
async function assignedEmployee(body) {
  const employee = await Employee.findById(body.employeeId);
  if (!employee) throw new ApiError(400, "Assigned employee does not exist.");
  if (employee.status === "Inactive")
    throw new ApiError(400, "Inactive employees cannot be assigned tasks.");
  if (
    employee.status === "On Leave" &&
    body.startDate >= employee.leaveStart &&
    body.startDate <= employee.leaveEnd
  )
    throw new ApiError(
      400,
      `This employee is on leave from ${employee.leaveStart} through ${employee.leaveEnd}.`,
    );
  return employee;
}
export async function listTasks(query) {
  const options = parseQuery(query),
    total = await Task.countDocuments(options.filter);
  let rows;
  if (options.sortKey === "priority") {
    rows = await Task.find(options.filter)
      .populate("employee")
      .sort({ _id: options.direction });
    rows.sort((a, b) => {
      const diff =
        (priorities.indexOf(a.priority) - priorities.indexOf(b.priority)) *
        options.direction;
      if (diff !== 0) return diff;
      return String(b._id).localeCompare(String(a._id)) * options.direction;
    });
    rows = rows.slice(
      (options.page - 1) * options.limit,
      options.page * options.limit,
    );
  } else {
    rows = await Task.find(options.filter)
      .populate("employee")
      .sort(options.sort)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit);
  }
  return {
    data: rows.map(taskOutput),
    total,
    page: options.page,
    limit: options.limit,
    pages: Math.ceil(total / options.limit),
  };
}
export async function createTask(body) {
  validateTask(body);
  const employee = await assignedEmployee(body);
  if (
    (await Task.countDocuments({
      employee: employee._id,
      status: { $in: activeStatuses },
    })) >= 3
  )
    throw new ApiError(
      400,
      "This employee already has 3 active tasks. Complete or reassign a task first.",
    );
  const task = await Task.create({
    title: body.title.trim(),
    description: body.description || "",
    employee: employee._id,
    employeeSnapshot: snapshot(employee),
    department: body.department,
    priority: body.priority,
    status: "Todo",
    startDate: body.startDate,
    dueDate: body.dueDate,
    createdDate: new Date().toISOString().slice(0, 10),
  });
  return taskOutput(await task.populate("employee"));
}
export async function getTask(id) {
  return taskOutput(await findTask(id, true));
}
export async function updateTask(id, body) {
  const task = await findTask(id);
  if (["Completed", "Cancelled"].includes(task.status))
    throw new ApiError(400, "Completed and cancelled tasks cannot be edited.");
  if (body.status !== undefined && body.status !== task.status)
    throw new ApiError(
      400,
      "Task status cannot be edited directly. Use PUT /api/tasks/:id/status instead.",
    );
  validateTask(body);
  const employee = await assignedEmployee(body);
  if (
    String(task.employee) !== String(employee._id) &&
    (await Task.countDocuments({
      _id: { $ne: task._id },
      employee: employee._id,
      status: { $in: activeStatuses },
    })) >= 3
  )
    throw new ApiError(
      400,
      "This employee already has 3 active tasks. Complete or reassign a task first.",
    );
  Object.assign(task, {
    title: body.title.trim(),
    description: body.description || "",
    employee: employee._id,
    employeeSnapshot: snapshot(employee),
    department: body.department,
    priority: body.priority,
    startDate: body.startDate,
    dueDate: body.dueDate,
  });
  await task.save();
  return taskOutput(await task.populate("employee"));
}
export async function updateTaskStatus(id, status) {
  const task = await findTask(id);
  const allowed =
    task.status === "Todo"
      ? ["In Progress", "Cancelled"]
      : task.status === "In Progress"
        ? ["Completed", "Cancelled"]
        : [];
  if (!allowed.includes(status))
    throw new ApiError(
      400,
      `Cannot change task status from ${task.status} to ${status || "the requested status"}.`,
    );
  task.status = status;
  if (status === "Completed")
    task.completedDate = new Date().toISOString().slice(0, 10);
  await task.save();
  return taskOutput(await task.populate("employee"));
}
export async function deleteTask(id) {
  const task = await findTask(id);
  if (["Completed", "Cancelled"].includes(task.status))
    throw new ApiError(
      400,
      "Completed and cancelled tasks cannot be edited or deleted.",
    );
  await task.deleteOne();
}
export async function exportTasks(query) {
  const options = parseQuery({ ...query, page: 1, limit: 1000 }, true);
  const tasks = await Task.find(options.filter)
    .populate("employee")
    .sort(options.sort);
  if (options.sortKey === "priority")
    tasks.sort((a, b) => {
      const diff =
        (priorities.indexOf(a.priority) - priorities.indexOf(b.priority)) *
        options.direction;
      if (diff !== 0) return diff;
      return String(b._id).localeCompare(String(a._id)) * options.direction;
    });
  return tasks.map(taskOutput);
}

import Employee from "../models/Employee.js";
import Task, { activeStatuses } from "../models/Task.js";

export async function getDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [
    total,
    active,
    todo,
    inProgress,
    completed,
    cancelled,
    overdue,
    employeeCount,
    activeEmployees,
    inactiveEmployees,
    onLeaveEmployees,
    employees,
    byDepartment,
  ] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: { $in: activeStatuses } }),
      Task.countDocuments({ status: "Todo" }),
      Task.countDocuments({ status: "In Progress" }),
      Task.countDocuments({ status: "Completed" }),
      Task.countDocuments({ status: "Cancelled" }),
      Task.countDocuments({
        dueDate: { $lt: today },
        status: { $nin: ["Completed", "Cancelled"] },
      }),
      Employee.countDocuments(),
      Employee.countDocuments({ status: "Active" }),
      Employee.countDocuments({ status: "Inactive" }),
      Employee.countDocuments({ status: "On Leave" }),
      Employee.find({ status: "Active" }).select("fullName department status"),
      Task.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]),
    ]);
  const workload = await Promise.all(
    employees.map(async (employee) => ({
      employeeId: employee._id,
      fullName: employee.fullName,
      department: employee.department,
      activeTasks: await Task.countDocuments({
        employee: employee._id,
        status: { $in: activeStatuses },
      }),
    })),
  );
  return {
    counts: {
      total,
      active,
      todo,
      inProgress,
      completed,
      cancelled,
      overdue,
      employees: employeeCount,
      activeEmployees,
      inactiveEmployees,
      onLeaveEmployees,
    },
    workload,
    byDepartment: Object.fromEntries(
      byDepartment.map(({ _id, count }) => [_id, count]),
    ),
  };
}

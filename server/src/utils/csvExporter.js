const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function tasksToCsv(
  tasks,
  today = new Date().toISOString().slice(0, 10),
) {
  const headers = [
    "Task ID",
    "Title",
    "Description",
    "Employee",
    "Employee ID",
    "Department",
    "Priority",
    "Status",
    "Start Date",
    "Due Date",
    "Created Date",
    "Completed Date",
    "Overdue",
  ];
  const rows = tasks.map((task) => [
    task.taskId || `TSK-${String(task._id).slice(-6).toUpperCase()}`,
    task.title,
    task.description,
    task.employeeName,
    task.employeeSnapshot?.employeeId || "",
    task.department,
    task.priority,
    task.status,
    task.startDate,
    task.dueDate,
    task.createdDate,
    task.completedDate || "",
    task.status !== "Completed" &&
    task.status !== "Cancelled" &&
    today > task.dueDate
      ? "Overdue"
      : "On time",
  ]);
  return [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");
}

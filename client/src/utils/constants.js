const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const departments = ["Development", "Design", "QA", "HR", "Sales"];
const priorities = ["Low", "Medium", "High", "Critical"];
const statuses = ["Todo", "In Progress", "Completed", "Cancelled"];
const employeeStatuses = ["Active", "Inactive", "On Leave"];
const today = new Date().toISOString().slice(0, 10);

export {
  API,
  departments,
  priorities,
  statuses,
  employeeStatuses,
  today,
};

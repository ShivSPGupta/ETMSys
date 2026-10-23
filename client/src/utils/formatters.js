const initials = (n) =>
  n
    ?.split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "??";
const isOverdue = (t) => {
  if (!t) return false;
  if (typeof t.isOverdue === "boolean") return t.isOverdue;
  return (
    t.status !== "Completed" &&
    t.status !== "Cancelled" &&
    Boolean(t.dueDate) &&
    t.dueDate < today
  );
};
const priorityClass = (p) => p?.toLowerCase();
export { initials, isOverdue, priorityClass };
import { today } from "./constants.js";

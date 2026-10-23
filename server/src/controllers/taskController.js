import * as taskService from "../services/taskService.js";
import { tasksToCsv } from "../utils/csvExporter.js";

export async function list(req, res) {
  res.json(await taskService.listTasks(req.query));
}
export async function create(req, res) {
  res.status(201).json({ data: await taskService.createTask(req.body) });
}
export async function get(req, res) {
  res.json({ data: await taskService.getTask(req.params.id) });
}
export async function update(req, res) {
  res.json({ data: await taskService.updateTask(req.params.id, req.body) });
}
export async function updateStatus(req, res) {
  res.json({
    data: await taskService.updateTaskStatus(req.params.id, req.body.status),
  });
}
export async function remove(req, res) {
  await taskService.deleteTask(req.params.id);
  res.json({ message: "Task deleted." });
}
export async function exportCsv(req, res) {
  const csv = tasksToCsv(await taskService.exportTasks(req.query));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="tasks.csv"');
  res.send(csv);
}

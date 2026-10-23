import * as employeeService from "../services/employeeService.js";

export async function list(req, res) {
  res.json(await employeeService.listEmployees(req.query));
}
export async function create(req, res) {
  res
    .status(201)
    .json({ data: await employeeService.createEmployee(req.body) });
}
export async function get(req, res) {
  res.json({ data: await employeeService.getEmployee(req.params.id) });
}
export async function update(req, res) {
  res.json({
    data: await employeeService.updateEmployee(req.params.id, req.body),
  });
}
export async function remove(req, res) {
  await employeeService.deleteEmployee(req.params.id);
  res.json({ message: "Employee deleted. Historical tasks are preserved." });
}

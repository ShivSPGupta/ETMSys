import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import app from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";
import Employee from "../src/models/Employee.js";
import Task from "../src/models/Task.js";

const PORT = 5055;
let server;
const baseUrl = `http://localhost:${PORT}/api`;

const request = async (path, options = {}) => {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, headers: res.headers, body: json };
};

describe("ETM System Business Rules and API Tests", () => {
  let activeEmp1, activeEmp2, inactiveEmp, onLeaveEmp;

  before(async () => {
    await connectDatabase();
    await new Promise((resolve) => {
      server = app.listen(PORT, resolve);
    });

    // Clean test database
    await Task.deleteMany({});
    await Employee.deleteMany({});

    // Seed test employees
    activeEmp1 = await Employee.create({
      employeeId: "TEST-001",
      fullName: "Alice Developer",
      email: "alice@test.com",
      department: "Development",
      role: "Software Engineer",
      joiningDate: "2024-01-01",
      status: "Active",
    });

    activeEmp2 = await Employee.create({
      employeeId: "TEST-002",
      fullName: "Bob Designer",
      email: "bob@test.com",
      department: "Design",
      role: "UI/UX Designer",
      joiningDate: "2024-01-01",
      status: "Active",
    });

    inactiveEmp = await Employee.create({
      employeeId: "TEST-003",
      fullName: "Charlie Inactive",
      email: "charlie@test.com",
      department: "QA",
      role: "QA Tester",
      joiningDate: "2024-01-01",
      status: "Inactive",
    });

    onLeaveEmp = await Employee.create({
      employeeId: "TEST-004",
      fullName: "Diana OnLeave",
      email: "diana@test.com",
      department: "HR",
      role: "HR Specialist",
      joiningDate: "2024-01-01",
      status: "On Leave",
      leaveStart: "2026-11-01",
      leaveEnd: "2026-11-10",
    });
  });

  after(async () => {
    await Task.deleteMany({});
    await Employee.deleteMany({});
    await mongoose.disconnect();
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  it("Rule 1: Reject duplicate Employee ID with 409", async () => {
    const res = await request("/employees", {
      method: "POST",
      body: {
        employeeId: "TEST-001",
        fullName: "Another Alice",
        email: "alice2@test.com",
        department: "Development",
        role: "Dev",
        joiningDate: "2024-01-01",
        status: "Active",
      },
    });
    assert.equal(res.status, 409);
    assert.match(res.body.message, /already exists/i);
  });

  it("Rule 2: Reject duplicate Email with 409", async () => {
    const res = await request("/employees", {
      method: "POST",
      body: {
        employeeId: "TEST-999",
        fullName: "Duplicate Email",
        email: "alice@test.com",
        department: "Development",
        role: "Dev",
        joiningDate: "2024-01-01",
        status: "Active",
      },
    });
    assert.equal(res.status, 409);
    assert.match(res.body.message, /already exists/i);
  });

  it("Rule 3: Assignment - Inactive employee is always rejected with 400", async () => {
    const res = await request("/tasks", {
      method: "POST",
      body: {
        title: "Task for inactive",
        employeeId: inactiveEmp._id.toString(),
        department: "QA",
        priority: "Medium",
        startDate: "2026-11-05",
        dueDate: "2026-11-15",
      },
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /inactive/i);
  });

  it("Rule 4: Assignment - On Leave employee rejected if start date is within leave period", async () => {
    const res = await request("/tasks", {
      method: "POST",
      body: {
        title: "Task during leave",
        employeeId: onLeaveEmp._id.toString(),
        department: "HR",
        priority: "High",
        startDate: "2026-11-05", // Inside 2026-11-01 to 2026-11-10
        dueDate: "2026-11-20",
      },
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /leave/i);
  });

  it("Rule 5: Assignment - On Leave employee accepted if start date is outside leave period", async () => {
    const res = await request("/tasks", {
      method: "POST",
      body: {
        title: "Task outside leave",
        employeeId: onLeaveEmp._id.toString(),
        department: "HR",
        priority: "High",
        startDate: "2026-11-15", // After leaveEnd
        dueDate: "2026-11-20",
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.title, "Task outside leave");
    assert.equal(res.body.data.status, "Todo");
  });

  it("Rule 6: Dates - Due date cannot be earlier than start date (400)", async () => {
    const res = await request("/tasks", {
      method: "POST",
      body: {
        title: "Invalid dates task",
        employeeId: activeEmp1._id.toString(),
        department: "Development",
        priority: "Low",
        startDate: "2026-11-15",
        dueDate: "2026-11-10",
      },
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /due date cannot be earlier/i);
  });

  it("Rule 7: Capacity - One employee can hold at most 3 active tasks (Todo + In Progress)", async () => {
    // ActiveEmp1 gets 1st task
    const t1 = await request("/tasks", {
      method: "POST",
      body: {
        title: "Task 1",
        employeeId: activeEmp1._id.toString(),
        department: "Development",
        priority: "Medium",
        startDate: "2026-11-01",
        dueDate: "2026-11-10",
      },
    });
    assert.equal(t1.status, 201);

    // ActiveEmp1 gets 2nd task
    const t2 = await request("/tasks", {
      method: "POST",
      body: {
        title: "Task 2",
        employeeId: activeEmp1._id.toString(),
        department: "Development",
        priority: "High",
        startDate: "2026-11-01",
        dueDate: "2026-11-10",
      },
    });
    assert.equal(t2.status, 201);

    // ActiveEmp1 gets 3rd task
    const t3 = await request("/tasks", {
      method: "POST",
      body: {
        title: "Task 3",
        employeeId: activeEmp1._id.toString(),
        department: "Development",
        priority: "Critical",
        startDate: "2026-11-01",
        dueDate: "2026-11-10",
      },
    });
    assert.equal(t3.status, 201);

    // ActiveEmp1 gets 4th task -> REJECTED 400
    const t4 = await request("/tasks", {
      method: "POST",
      body: {
        title: "Task 4",
        employeeId: activeEmp1._id.toString(),
        department: "Development",
        priority: "Low",
        startDate: "2026-11-01",
        dueDate: "2026-11-10",
      },
    });
    assert.equal(t4.status, 400);
    assert.match(resOrMessage(t4), /3 active tasks/i);
  });

  it("Rule 8: Status Flow - Todo -> In Progress -> Completed, and Completed date set by server", async () => {
    // Create new task for activeEmp2
    const created = await request("/tasks", {
      method: "POST",
      body: {
        title: "Status Flow Task",
        employeeId: activeEmp2._id.toString(),
        department: "Design",
        priority: "Medium",
        startDate: "2026-11-01",
        dueDate: "2026-11-10",
      },
    });
    assert.equal(created.status, 201);
    const taskId = created.body.data._id;
    assert.equal(created.body.data.status, "Todo");

    // Invalid jump: Todo -> Completed is rejected with 400
    const invalidJump = await request(`/tasks/${taskId}/status`, {
      method: "PUT",
      body: { status: "Completed" },
    });
    assert.equal(invalidJump.status, 400);

    // Valid: Todo -> In Progress
    const inProgressRes = await request(`/tasks/${taskId}/status`, {
      method: "PUT",
      body: { status: "In Progress" },
    });
    assert.equal(inProgressRes.status, 200);
    assert.equal(inProgressRes.body.data.status, "In Progress");

    // Valid: In Progress -> Completed
    const completedRes = await request(`/tasks/${taskId}/status`, {
      method: "PUT",
      body: { status: "Completed" },
    });
    assert.equal(completedRes.status, 200);
    assert.equal(completedRes.body.data.status, "Completed");
    assert.ok(completedRes.body.data.completedDate);

    // Terminal: Completed task cannot change status (400)
    const terminalChange = await request(`/tasks/${taskId}/status`, {
      method: "PUT",
      body: { status: "In Progress" },
    });
    assert.equal(terminalChange.status, 400);

    // Terminal: Completed task cannot be edited (400)
    const editCompleted = await request(`/tasks/${taskId}`, {
      method: "PUT",
      body: {
        title: "Edited completed title",
        employeeId: activeEmp2._id.toString(),
        department: "Design",
        priority: "Medium",
        startDate: "2026-11-01",
        dueDate: "2026-11-10",
      },
    });
    assert.equal(editCompleted.status, 400);
    assert.match(resOrMessage(editCompleted), /cannot be edited/i);
  });

  it("Rule 9: Normal update cannot change status directly", async () => {
    // Create new task for activeEmp2
    const created = await request("/tasks", {
      method: "POST",
      body: {
        title: "Direct status update test",
        employeeId: activeEmp2._id.toString(),
        department: "Design",
        priority: "Low",
        startDate: "2026-11-01",
        dueDate: "2026-11-10",
      },
    });
    const taskId = created.body.data._id;

    const tryStatusChange = await request(`/tasks/${taskId}`, {
      method: "PUT",
      body: {
        title: "Direct status update test",
        employeeId: activeEmp2._id.toString(),
        department: "Design",
        priority: "Low",
        startDate: "2026-11-01",
        dueDate: "2026-11-10",
        status: "In Progress",
      },
    });
    assert.equal(tryStatusChange.status, 400);
  });

  it("Rule 10: Delete employee - Blocked while employee has active tasks", async () => {
    // ActiveEmp1 currently has 3 active tasks
    const delRes = await request(`/employees/${activeEmp1._id.toString()}`, {
      method: "DELETE",
    });
    assert.equal(delRes.status, 400);
    assert.match(resOrMessage(delRes), /Todo or In Progress tasks/i);
  });

  it("Rule 11: Delete employee - Allowed when no active tasks, preserving meaningful snapshot on historical tasks", async () => {
    // Create an employee with only a Completed task
    const empToDelete = await Employee.create({
      employeeId: "DEL-001",
      fullName: "Dan Historical",
      email: "dan@test.com",
      department: "Sales",
      role: "Sales Rep",
      joiningDate: "2024-01-01",
      status: "Active",
    });

    const historicalTask = await Task.create({
      title: "Dan's finished task",
      employee: empToDelete._id,
      employeeSnapshot: {
        fullName: empToDelete.fullName,
        employeeId: empToDelete.employeeId,
        email: empToDelete.email,
        department: empToDelete.department,
        role: empToDelete.role,
      },
      department: "Sales",
      priority: "Low",
      status: "Completed",
      startDate: "2026-09-01",
      dueDate: "2026-09-10",
      createdDate: "2026-09-01",
      completedDate: "2026-09-10",
    });

    // Deletion allowed
    const delRes = await request(`/employees/${empToDelete._id.toString()}`, {
      method: "DELETE",
    });
    assert.equal(delRes.status, 200);

    // Historical task still displays Dan's meaningful details
    const taskGet = await request(`/tasks/${historicalTask._id.toString()}`);
    assert.equal(taskGet.status, 200);
    assert.equal(taskGet.body.data.employeeName, "Dan Historical");
    assert.equal(taskGet.body.data.employeeSnapshot.employeeId, "DEL-001");
  });

  it("Rule 12: Dashboard API - Calculates counts and workload on the server", async () => {
    const dashRes = await request("/dashboard");
    assert.equal(dashRes.status, 200);
    assert.ok(dashRes.body.counts);
    assert.ok(typeof dashRes.body.counts.total === "number");
    assert.ok(Array.isArray(dashRes.body.workload));
  });

  it("Rule 13: Export CSV - Returns CSV text with all headers and overdue flag", async () => {
    const csvRes = await request("/tasks/export");
    assert.equal(csvRes.status, 200);
    assert.match(csvRes.body, /"Task ID","Title","Description"/);
    assert.match(csvRes.body, /"Overdue"/);
  });

  it("Rule 14: Pagination determinism - No duplicate tasks across pages when multiple records share createdDate", async () => {
    // Fetch page 1 and page 2
    const p1 = await request("/tasks?page=1&limit=4");
    const p2 = await request("/tasks?page=2&limit=4");
    assert.equal(p1.status, 200);
    assert.equal(p2.status, 200);
    const p1Ids = p1.body.data.map((t) => t._id);
    const p2Ids = p2.body.data.map((t) => t._id);
    const overlap = p1Ids.filter((id) => p2Ids.includes(id));
    assert.equal(overlap.length, 0, `Found duplicate tasks across pages: ${overlap.join(", ")}`);
  });
});

function resOrMessage(res) {
  return typeof res.body === "object" ? res.body.message || "" : res.body;
}

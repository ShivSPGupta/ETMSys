# Employee & Task Management System (ETM)

A full-stack MERN application for managing employees and assigning tasks, featuring backend-enforced business rules, server-side pagination, search, multi-filter combinations, sorting, URL synchronization, and responsive design across desktop, tablet, and mobile.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+ or v20+)
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/orbit`)

### 1. Server Setup
```bash
cd server
npm install
npm run seed     # Seeds realistic employees and tasks across departments
npm run test     # Runs the 13 automated business rules verification tests
npm run dev      # Starts Express API at http://localhost:5000
```
> Note: `server/.env` is configured with `PORT=5000` and `MONGODB_URI=mongodb://127.0.0.1:27017/orbit`.

### 2. Client Setup
```bash
cd client
npm install
npm run dev      # Starts Vite dev server (e.g. http://localhost:5173)
```

---

## 🛡️ Business Rules (Strictly Enforced on the Backend)

1. **Task Assignment**:
   - Tasks can be assigned only to **Active** employees.
   - Assigning to **Inactive** employees is always rejected (HTTP 400).
   - Assigning to an **On Leave** employee is rejected if the task's `startDate` falls within their leave period (`leaveStart` through `leaveEnd`, both dates inclusive) (HTTP 400).
   - Assigning to an **On Leave** employee whose task `startDate` is outside the leave period is permitted.

2. **Date Constraints**:
   - `dueDate` cannot be earlier than `startDate` (HTTP 400).

3. **Status Flow Transitions**:
   - Allowed transitions: `Todo → In Progress → Completed` and `Todo / In Progress → Cancelled`.
   - Any other jump (e.g., `Todo → Completed` or changing status of Completed/Cancelled tasks) is rejected (HTTP 400).
   - New tasks always start in `Todo`.
   - Task status can only be modified via `PUT /api/tasks/:id/status`; normal task updates (`PUT /api/tasks/:id`) reject status modifications.

4. **Terminal Statuses (Completed & Cancelled)**:
   - Completed and Cancelled tasks cannot be edited (HTTP 400).
   - Completed and Cancelled tasks cannot be deleted (HTTP 400).

5. **Completed Date**:
   - `completedDate` is automatically stamped with the server's current date when a task becomes `Completed`. It is never accepted from client input.

6. **Capacity Limit**:
   - An employee can hold at most **3 active tasks** (`Todo` + `In Progress`) at a time. Assignments exceeding this are rejected (HTTP 400).

7. **Overdue Calculation**:
   - Overdue is defined as: `today > dueDate` AND status is not `Completed` or `Cancelled`.
   - Reflected consistently across List, View Details, Dashboard statistics, and CSV Export.

8. **Employee Deletion Safety & Historical Data Preservation**:
   - Deleting an employee with active tasks (`Todo` or `In Progress`) is strictly disallowed (HTTP 400).
   - When an employee is deleted, their completed/cancelled historical tasks retain all meaningful employee information via a frozen `employeeSnapshot` (Full Name, Employee ID, Department, Role, Email).

---

## 📡 API Overview

### Employees (`/api/employees`)
- `GET /api/employees` - Paginated list (`page`, `limit`), filter by `department`, `status`, search by name/id/email, sort by `fullName`, `employeeId`, `department`, `role`, `joiningDate`, `status`.
- `POST /api/employees` - Create employee (checks unique employeeId and email, HTTP 409 on duplicates).
- `GET /api/employees/:id` - Get employee profile by ID.
- `PUT /api/employees/:id` - Update employee details (updates snapshots on assigned tasks).
- `DELETE /api/employees/:id` - Delete employee (blocked if active tasks exist).

### Tasks (`/api/tasks`)
- `GET /api/tasks` - Paginated list (`page`, `limit`), search title & employee name, filters (`department`, `priority`, `status`, `dueFrom`, `dueTo`), sorting (`createdDate`, `dueDate`, `priority` by importance, `title`).
- `POST /api/tasks` - Create task with business rule validation.
- `GET /api/tasks/:id` - Get task details with populated or snapshot employee data.
- `PUT /api/tasks/:id` - Update task details (cannot edit completed/cancelled tasks, cannot change status).
- `PUT /api/tasks/:id/status` - Update task status enforcing allowed state machine transitions.
- `DELETE /api/tasks/:id` - Delete task (only active tasks; completed/cancelled cannot be deleted).
- `GET /api/tasks/export` - Export all tasks matching current filters and sorting directly to CSV.

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard` - Server-calculated task counts (`total`, `todo`, `inProgress`, `completed`, `cancelled`, `overdue`), employee counts (`employees`, `activeEmployees`, `inactiveEmployees`, `onLeaveEmployees`), and active employee workload breakdown.

---

## 💻 Frontend Features

- **Responsive Design**: Optimized for Desktop, Tablet, and Mobile devices with horizontal table scrolling, responsive stacking, and mobile nav.
- **URL Synchronization**:
  - Search queries, filters, sorting, and pagination numbers stay synchronized in the URL (e.g. `/tasks?status=In%20Progress&priority=High&page=2`).
  - Refreshing or sharing the URL preserves the exact same view.
- **Server-Driven Data**: No in-memory filtering or mock data; all views query the Express API.
- **Dynamic Status Transitions**: Status dropdown in tables and detail views renders only valid next statuses according to the state machine.
- **User Feedback**: Friendly toast notifications for both successes and server errors (e.g., 400 bad requests, 409 duplicates).
- **Reusable Component Architecture**: Divided into clean components (`DataTable`, `Pagination`, `FilterSelect`, `StatusBadge`, `PriorityBadge`, `TaskTableRow`, `TaskStatusControl`, `ConfirmDialog`, `ToastContainer`, etc.).

---

## 🧪 Testing

Run automated tests verifying all business rules:
```bash
npm --prefix server run test
```
The test suite validates:
- 409 on duplicate Employee ID
- 409 on duplicate Email
- 400 on assigning tasks to Inactive employees
- 400 on assigning tasks to On Leave employees within leave dates
- 201 on assigning tasks to On Leave employees outside leave dates
- 400 on Due Date < Start Date
- 400 when exceeding 3 active tasks capacity limit
- Status state flow transitions (`Todo -> In Progress -> Completed`, server-set `completedDate`)
- Disallowing terminal status modifications and direct update status editing
- 400 when attempting to delete an employee with active tasks
- Deletion of employee with retention of historical snapshot details
- Server-calculated dashboard counts and workload
- CSV Export with filters and overdue indicators

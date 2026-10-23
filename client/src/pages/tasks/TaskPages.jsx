/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowDownUp,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  ListFilter,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  departments,
  priorities,
  statuses,
  today,
} from "../../utils/constants.js";
import { taskApi } from "../../api/taskApi.js";
import { employeeApi } from "../../api/employeeApi.js";
import { getErrorMessage } from "../../api/axios.js";
import TaskStatusControl from "../../components/tasks/TaskStatusControl.jsx";
import { isOverdue } from "../../utils/formatters.js";
import {
  Avatar,
  Button,
  FilterSelect,
  FormField,
  NotFound,
  PageTitle,
  Pagination,
  PriorityBadge,
  Restricted,
  StatusBadge,
} from "../../components/common/index.jsx";

const PAGE_SIZE = 8;

function TaskList({ notify }) {
  const [params, setParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);

  const q = params.get("search") || "";
  const [searchInput, setSearchInput] = useState(q);
  const dept = params.get("department") || "";
  const priority = params.get("priority") || "";
  const status = params.get("status") || "";
  const dueFrom = params.get("dueFrom") || "";
  const dueTo = params.get("dueTo") || "";
  const sort = params.get("sort") || "createdDate";
  const direction = params.get("direction") || "desc";
  const page = Number(params.get("page") || 1);

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Debounce search typing to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== q) {
        const next = new URLSearchParams(params);
        if (searchInput.trim()) {
          next.set("search", searchInput.trim());
        } else {
          next.delete("search");
        }
        next.delete("page");
        setParams(next);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    setParams(next);
  };

  const toggleSort = (field) => {
    const next = new URLSearchParams(params);
    if (sort === field) {
      next.set("direction", direction === "asc" ? "desc" : "asc");
    } else {
      next.set("sort", field);
      next.set("direction", "asc");
    }
    next.delete("page");
    setParams(next);
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await taskApi.list({
        page,
        limit: PAGE_SIZE,
        search: q,
        department: dept,
        priority,
        status,
        dueFrom,
        dueTo,
        sort,
        direction,
      });
      setTasks(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      if (notify) {
        notify(getErrorMessage(err, "Failed to load tasks."), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [params]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const exportParams = Object.fromEntries(params.entries());
      delete exportParams.page;
      delete exportParams.limit;

      const blob = await taskApi.export(exportParams);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `tasks_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      if (notify) notify("CSV file downloaded successfully.");
    } catch (err) {
      if (notify) {
        notify(getErrorMessage(err, "Failed to export tasks to CSV."), "error");
      }
    } finally {
      setExporting(false);
    }
  };

  const handleStatusUpdate = async (task, newStatus) => {
    try {
      await taskApi.updateStatus(task._id, newStatus);
      if (notify) notify(`Task status updated to ${newStatus}.`);
      fetchTasks();
    } catch (err) {
      if (notify) {
        notify(getErrorMessage(err, "Cannot update task status."), "error");
      }
    }
  };

  const handleDeleteTask = async (task) => {
    if (["Completed", "Cancelled"].includes(task.status)) {
      if (notify) {
        notify("Completed and cancelled tasks cannot be deleted.", "error");
      }
      return;
    }
    if (!window.confirm(`Delete task "${task.title}"?`)) return;

    try {
      await taskApi.remove(task._id);
      if (notify) notify("Task deleted successfully.");
      fetchTasks();
    } catch (err) {
      if (notify) {
        notify(getErrorMessage(err, "Failed to delete task."), "error");
      }
    }
  };

  return (
    <div className="page-content task-list-page">
      <PageTitle
        eyebrow="WORKSPACE / TASKS"
        title="Tasks"
        subtitle="Plan, track, and manage your team’s work in one place."
      />

      <div className="list-toolbar reference-toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            placeholder="Search title or employee..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <button
          className="button primary reference-search"
          onClick={() => setFilter("search", searchInput.trim())}
        >
          Search
        </button>
        <div className="reference-actions">
          <Button to="/tasks/new" icon={Plus}>
            Add Task
          </Button>
          <button
            className="button primary reference-export"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            <Download size={14} /> {exporting ? "Exporting..." : "Export To Csv"}
          </button>
        </div>
      </div>

      <div className="toolbar-right reference-filters">
        <FilterSelect
          value={dept}
          options={["", ...departments]}
          label="Department"
          onChange={(v) => setFilter("department", v)}
        />
        <FilterSelect
          value={priority}
          options={["", ...priorities]}
          label="Priority"
          onChange={(v) => setFilter("priority", v)}
        />
        <FilterSelect
          value={status}
          options={["", ...statuses]}
          label="Status"
          onChange={(v) => setFilter("status", v)}
        />
        <div className="due-range">
          <span>Due:</span>
          <input
            className="date-filter"
            type="date"
            aria-label="Due from"
            value={dueFrom}
            onChange={(e) => setFilter("dueFrom", e.target.value)}
          />
          <span>to</span>
          <input
            className="date-filter"
            type="date"
            aria-label="Due to"
            value={dueTo}
            onChange={(e) => setFilter("dueTo", e.target.value)}
          />
        </div>
        {(q || dept || priority || status || dueFrom || dueTo) && (
          <button
            className="button secondary clear-filter-btn"
            onClick={() => setParams(new URLSearchParams())}
          >
            Clear filters
          </button>
        )}
      </div>

      <section className="panel list-panel">
        <div className="list-panel-heading task-list-sort">
          <div>
            <b>All tasks</b>
            <span className="count-pill">{total}</span>
            {loading && <small className="table-updating-indicator">Updating...</small>}
          </div>
          <div className="sort-control">
            <ArrowDownUp size={14} />
            <select
              value={`${sort}:${direction}`}
              onChange={(e) => {
                const [s, d] = e.target.value.split(":");
                const next = new URLSearchParams(params);
                next.set("sort", s);
                next.set("direction", d);
                next.delete("page");
                setParams(next);
              }}
            >
              <option value="createdDate:desc">Newest first</option>
              <option value="dueDate:asc">Due date (Soonest)</option>
              <option value="priority:desc">Priority (High to Low)</option>
              <option value="priority:asc">Priority (Low to High)</option>
              <option value="title:asc">Title A–Z</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>TASK ID</th>
                <th>
                  TITLE{" "}
                  <button
                    className="table-sort-button"
                    onClick={() => toggleSort("title")}
                    aria-label="Sort by Title"
                  >
                    <ArrowDownUp size={11} />
                  </button>
                </th>
                <th>EMPLOYEE</th>
                <th>
                  PRIORITY{" "}
                  <button
                    className="table-sort-button"
                    onClick={() => toggleSort("priority")}
                    aria-label="Sort by Priority"
                  >
                    <ArrowDownUp size={11} />
                  </button>
                </th>
                <th>STATUS</th>
                <th>
                  DUE DATE{" "}
                  <button
                    className="table-sort-button"
                    onClick={() => toggleSort("dueDate")}
                    aria-label="Sort by Due Date"
                  >
                    <ArrowDownUp size={11} />
                  </button>
                </th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading && !tasks.length ? (
                <tr>
                  <td colSpan="7" className="table-empty-cell">
                    Loading tasks...
                  </td>
                </tr>
              ) : tasks.length ? (
                tasks.map((t) => (
                  <TaskTableRow
                    key={t._id}
                    task={t}
                    menuOpen={openActionId === t._id}
                    onMenuToggle={() =>
                      setOpenActionId((curr) => (curr === t._id ? null : t._id))
                    }
                    onStatusUpdate={(newStatus) => handleStatusUpdate(t, newStatus)}
                    onDelete={() => {
                      setOpenActionId(null);
                      handleDeleteTask(t);
                    }}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <ListFilter size={24} />
                      <b>No tasks found</b>
                      <span>Try adjusting your search or filters.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          total={total}
          size={PAGE_SIZE}
          setPage={(p) => {
            const next = new URLSearchParams(params);
            if (p > 1) {
              next.set("page", String(p));
            } else {
              next.delete("page");
            }
            setParams(next);
          }}
        />
      </section>
    </div>
  );
}

function TaskTableRow({
  task: t,
  menuOpen,
  onMenuToggle,
  onStatusUpdate,
  onDelete,
}) {
  const who = t.employeeName || "Former employee";
  const overdue = isOverdue(t);

  // Status flow rule:
  // Todo -> In Progress, Cancelled
  // In Progress -> Completed, Cancelled
  // Completed / Cancelled: no further changes
  const nextStatuses =
    t.status === "Todo"
      ? ["In Progress", "Cancelled"]
      : t.status === "In Progress"
        ? ["Completed", "Cancelled"]
        : [];

  const isTerminal = ["Completed", "Cancelled"].includes(t.status);

  return (
    <tr>
      <td className="task-id-cell">{t.taskId || `TSK-${String(t._id).slice(-6).toUpperCase()}`}</td>
      <td>
        <Link className="table-task-name" to={`/tasks/${t._id}`}>
          <span>
            <b>{t.title}</b>
            {overdue && <small className="date-overdue">Overdue</small>}
          </span>
        </Link>
      </td>
      <td>
        {t.assignedEmployeeId ? (
          <Link to={`/employees/${t.assignedEmployeeId}`} className="assignee-cell">
            <Avatar name={who} size="small" />
            <span>{who}</span>
          </Link>
        ) : (
          <span className="assignee-cell" title="Employee profile no longer exists. Details retained from snapshot.">
            <Avatar name={who} size="small" />
            <span className="former-employee-label">{who}</span>
          </span>
        )}
      </td>
      <td>
        <PriorityBadge priority={t.priority} />
      </td>
      <td>
        <div className="table-status">
          <StatusBadge status={t.status} />
          {nextStatuses.length > 0 && (
            <>
              <select
                aria-label={`Update ${t.title} status`}
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onStatusUpdate(e.target.value);
                  }
                }}
              >
                <option value="" disabled>
                  Change status
                </option>
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="status-dropdown-icon" size={12} aria-hidden="true" />
            </>
          )}
        </div>
      </td>
      <td className={overdue ? "date-overdue" : ""}>
        {overdue && <span className="overdue-dot" />}
        {new Date(`${t.dueDate}T00:00:00`).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        })}
        {overdue && <span className="overdue-label"> (Overdue)</span>}
      </td>
      <td>
        <details className="row-actions" open={menuOpen}>
          <summary
            aria-label="Task actions"
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.preventDefault();
              onMenuToggle();
            }}
          >
            <MoreHorizontal size={18} />
          </summary>
          <div className="row-actions-menu">
            <Link to={`/tasks/${t._id}`} onClick={() => onMenuToggle()}>
              View
            </Link>
            {!isTerminal ? (
              <Link to={`/tasks/${t._id}/edit`} onClick={() => onMenuToggle()}>
                Edit
              </Link>
            ) : (
              <button disabled title="Completed and cancelled tasks cannot be edited.">
                Edit
              </button>
            )}
            {!isTerminal ? (
              <button
                onClick={() => {
                  onMenuToggle();
                  onDelete();
                }}
              >
                Delete
              </button>
            ) : (
              <button disabled title="Completed and cancelled tasks cannot be deleted.">
                Delete
              </button>
            )}
          </div>
        </details>
      </td>
    </tr>
  );
}

function TaskForm({ notify }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    employeeId: "",
    department: "Development",
    priority: "Medium",
    startDate: today,
    dueDate: today,
  });

  const [employees, setEmployees] = useState([]);
  const [existingTask, setExistingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const empRes = await employeeApi.list({ limit: 100 });
        // Employees that can be assigned: Active, or On Leave (if startDate outside leave)
        // Inactive employees are always excluded from selection
        const assignable = (empRes.data || []).filter((e) => e.status !== "Inactive");
        setEmployees(assignable);

        if (id) {
          const taskRes = await taskApi.get(id);
          setExistingTask(taskRes);
          setForm({
            title: taskRes.title || "",
            description: taskRes.description || "",
            employeeId: taskRes.assignedEmployeeId || taskRes.employeeId || "",
            department: taskRes.department || "Development",
            priority: taskRes.priority || "Medium",
            startDate: taskRes.startDate || today,
            dueDate: taskRes.dueDate || today,
          });
        }
      } catch (err) {
        if (notify) {
          notify(getErrorMessage(err, "Failed to load task details."), "error");
        }
        navigate("/tasks");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id]);

  const change = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === "employeeId") {
      const selected = employees.find((emp) => emp._id === e.target.value);
      if (selected?.department) {
        next.department = selected.department;
      }
    }
    setForm(next);
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Task title is required.";
    if (!form.employeeId) errs.employeeId = "Choose an employee.";
    if (!form.startDate) errs.startDate = "Start date is required.";
    if (!form.dueDate) {
      errs.dueDate = "Due date is required.";
    } else if (form.dueDate < form.startDate) {
      errs.dueDate = "Due date cannot be earlier than start date.";
    }
    if (!departments.includes(form.department)) {
      errs.department = "Choose a valid department.";
    }
    if (!priorities.includes(form.priority)) {
      errs.priority = "Choose a valid priority.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) return;
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || "",
      employeeId: form.employeeId,
      department: form.department,
      priority: form.priority,
      startDate: form.startDate,
      dueDate: form.dueDate,
    };

    try {
      if (id) {
        await taskApi.update(id, payload);
        if (notify) notify("Task updated successfully.");
      } else {
        await taskApi.create(payload);
        if (notify) notify("Task created and assigned successfully.");
      }
      navigate("/tasks");
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to save task.");
      if (notify) notify(msg, "error");
      if (msg.toLowerCase().includes("due date")) {
        setErrors((prev) => ({ ...prev, dueDate: msg }));
      } else if (msg.toLowerCase().includes("active tasks") || msg.toLowerCase().includes("leave")) {
        setErrors((prev) => ({ ...prev, employeeId: msg }));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content form-page">
        <div className="page-loading-state">Loading task...</div>
      </div>
    );
  }

  // Business Rule: Completed and Cancelled tasks cannot be edited!
  if (existingTask && ["Completed", "Cancelled"].includes(existingTask.status)) {
    return <Restricted status={existingTask.status} />;
  }

  return (
    <div className="page-content form-page">
      <Link to="/tasks" className="back-link">
        <ArrowLeft size={16} /> Back to tasks
      </Link>
      <PageTitle
        eyebrow="WORKSPACE / TASKS"
        title={id ? "Edit Task" : "Add Task"}
        subtitle={
          id
            ? "Update task details, schedule, or reassignment."
            : "Add a task and assign it to an active employee."
        }
      />
      <form className="panel form-panel" onSubmit={submit}>
        <div className="form-section-title">
          <span className="section-icon">
            <ClipboardList size={17} />
          </span>
          <div>
            <b>Task details</b>
            <p>Make the work clear and easy to track.</p>
          </div>
        </div>

        <div className="form-grid">
          <FormField label="Title" error={errors.title}>
            <input
              name="title"
              value={form.title}
              onChange={change}
              placeholder="e.g. Design homepage hero component"
              disabled={saving}
            />
          </FormField>

          <FormField label="Assigned Employee" error={errors.employeeId}>
            <select
              name="employeeId"
              value={form.employeeId}
              onChange={change}
              disabled={saving}
            >
              <option value="">Select an employee</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.fullName} · {e.department} {e.status === "On Leave" ? "(On Leave)" : ""}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Priority" error={errors.priority}>
            <select
              name="priority"
              value={form.priority}
              onChange={change}
              disabled={saving}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Department" error={errors.department}>
            <select
              name="department"
              value={form.department}
              onChange={change}
              disabled={saving}
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Start date" error={errors.startDate}>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={change}
              disabled={saving}
            />
          </FormField>

          <FormField label="Due date" error={errors.dueDate}>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={change}
              disabled={saving}
            />
          </FormField>

          <FormField label="Description" wide>
            <textarea
              name="description"
              value={form.description}
              onChange={change}
              placeholder="Add details, objectives, or acceptance criteria…"
              rows="3"
              disabled={saving}
            />
          </FormField>
        </div>

        <p className="capacity-note">
          <Sparkles size={14} /> Capacity rule: One employee can hold at most 3 active tasks (Todo + In Progress) at a time.
        </p>

        <div className="form-footer">
          <Link className="button secondary" to="/tasks">
            Cancel
          </Link>
          <button className="button primary" disabled={saving}>
            {saving ? "Saving…" : id ? "Save changes" : "Create task"}{" "}
            <ChevronRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

function TaskView({ notify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const fetchTask = async () => {
    setLoading(true);
    try {
      const res = await taskApi.get(id);
      setTask(res);
    } catch (err) {
      if (notify) {
        notify(getErrorMessage(err, "Task not found."), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  if (loading) {
    return (
      <div className="page-content detail-page">
        <div className="page-loading-state">Loading task details...</div>
      </div>
    );
  }

  if (!task) {
    return <NotFound type="task" />;
  }

  const nextStatuses =
    task.status === "Todo"
      ? ["In Progress", "Cancelled"]
      : task.status === "In Progress"
        ? ["Completed", "Cancelled"]
        : [];

  const isTerminal = ["Completed", "Cancelled"].includes(task.status);
  const overdue = isOverdue(task);

  const updateStatus = async (newStatus) => {
    setBusy(true);
    try {
      const updated = await taskApi.updateStatus(id, newStatus);
      setTask(updated);
      if (notify) notify(`Task status updated to ${newStatus}.`);
    } catch (err) {
      if (notify) {
        notify(getErrorMessage(err, "Failed to update task status."), "error");
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (isTerminal) {
      if (notify) {
        notify("Completed and cancelled tasks cannot be deleted.", "error");
      }
      return;
    }
    if (!window.confirm(`Delete task "${task.title}"?`)) return;

    try {
      await taskApi.remove(id);
      if (notify) notify("Task deleted.");
      navigate("/tasks");
    } catch (err) {
      if (notify) {
        notify(getErrorMessage(err, "Failed to delete task."), "error");
      }
    }
  };

  return (
    <div className="page-content detail-page">
      <Link to="/tasks" className="back-link">
        <ArrowLeft size={16} /> Back to tasks
      </Link>

      <PageTitle
        eyebrow="TASKS / DETAILS"
        title={task.title}
        subtitle={`Task ID: ${task.taskId || `TSK-${String(task._id).slice(-6).toUpperCase()}`} · Created ${new Date(`${task.createdDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
        action={
          <div className="header-actions">
            {!isTerminal && (
              <Button
                to={`/tasks/${id}/edit`}
                variant="secondary"
                icon={Settings}
              >
                Edit task
              </Button>
            )}
            {!isTerminal && (
              <Button variant="secondary" icon={Trash2} onClick={remove}>
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="detail-layout">
        <section className="panel detail-panel">
          <div className="detail-badges">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {overdue && <span className="overdue-pill">Overdue</span>}
          </div>

          <h2>Task description</h2>
          <p className="task-description">
            {task.description || "No description provided."}
          </p>

          <div className="detail-meta-grid">
            <div>
              <span>Department</span>
              <b>{task.department}</b>
            </div>
            <div>
              <span>Start date</span>
              <b>{task.startDate}</b>
            </div>
            <div>
              <span>Due date</span>
              <b className={overdue ? "date-overdue" : ""}>
                {task.dueDate}
                {overdue && " · Overdue"}
              </b>
            </div>
            <div>
              <span>Created date</span>
              <b>{task.createdDate}</b>
            </div>
            {task.completedDate && (
              <div>
                <span>Completed date</span>
                <b>{task.completedDate}</b>
              </div>
            )}
          </div>

          <TaskStatusControl
            status={task.status}
            nextStatuses={nextStatuses}
            busy={busy}
            onChange={updateStatus}
          />
        </section>

        <aside className="panel assigned-panel">
          <h3>Assigned to</h3>
          <div className="assigned-person">
            <Avatar name={task.employeeName} color="violet" />
            <span>
              <b>{task.employeeName || "Former employee"}</b>
              <small>
                {task.employeeSnapshot?.role || task.department}
                {task.isEmployeeDeleted && " (Former Employee - Details retained)"}
              </small>
            </span>
          </div>

          <div className="assigned-divider" />

          {task.assignedEmployeeId ? (
            <Link to={`/employees/${task.assignedEmployeeId}`} className="text-link">
              View employee profile <ChevronRight size={15} />
            </Link>
          ) : (
            <span className="assigned-meta-note">
              Employee was deleted. Historical details retained.
            </span>
          )}

          <div className="assigned-summary">
            <span>Task ID</span>
            <b>{task.taskId || `TSK-${String(task._id).slice(-6).toUpperCase()}`}</b>
          </div>
          {task.employeeSnapshot?.employeeId && (
            <div className="assigned-summary">
              <span>Employee ID</span>
              <b>{task.employeeSnapshot.employeeId}</b>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export { TaskList, TaskForm, TaskView };

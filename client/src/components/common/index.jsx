import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Ellipsis,
  MoreHorizontal,
} from "lucide-react";
import { initials, isOverdue, priorityClass } from "../../utils/formatters.js";

function PageTitle({ eyebrow, title, subtitle, action }) {
  return (
    <div className="page-title-row">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function Button({
  children,
  to,
  onClick,
  variant = "primary",
  icon: Icon,
  ...props
}) {
  return to ? (
    <Link className={`button ${variant}`} to={to} {...props}>
      {Icon && <Icon size={16} />}
      {children}
    </Link>
  ) : (
    <button className={`button ${variant}`} onClick={onClick} {...props}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function Avatar({ name, color, size = "" }) {
  return (
    <span className={`avatar avatar-${color || "violet"} ${size}`}>
      {initials(name)}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`status-badge status-${status?.toLowerCase().replace(" ", "-")}`}
    >
      <i />
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span className={`priority priority-${priorityClass(priority)}`}>
      <i />
      {priority}
    </span>
  );
}

function TaskRow({ task: t }) {
  const owner =
    t.employeeName || t.assignedEmployee?.fullName || "Former employee";
  const empId = t.assignedEmployeeId || (t.employeeId?.length === 24 ? t.employeeId : null);
  return (
    <tr>
      <td>
        <Link to={`/tasks/${t._id}`} className="task-title-link">
          <span className="task-check">
            {t.status === "Completed" ? <Check size={12} /> : ""}
          </span>
          <span>
            {t.title}
            {isOverdue(t) && <span className="overdue-inline">Overdue</span>}
          </span>
        </Link>
      </td>
      <td>
        {empId ? (
          <Link to={`/employees/${empId}`} className="assignee-cell">
            <Avatar name={owner} color="violet" size="small" />
            <span>{owner}</span>
          </Link>
        ) : (
          <span className="assignee-cell" title="Former employee">
            <Avatar name={owner} color="violet" size="small" />
            <span>{owner}</span>
          </span>
        )}
      </td>
      <td>
        <PriorityBadge priority={t.priority} />
      </td>
      <td>
        <StatusBadge status={t.status} />
      </td>
      <td className={isOverdue(t) ? "date-overdue" : ""}>
        {t.dueDate
          ? new Date(`${t.dueDate}T00:00:00`).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "—"}
      </td>
      <td>
        <Link to={`/tasks/${t._id}`} className="row-menu">
          <Ellipsis size={18} />
        </Link>
      </td>
    </tr>
  );
}

function StatCard({ label, value, change, trend, icon: Icon, tint, foot }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${tint}`}>
          <Icon size={17} />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">
        <span className={`stat-change ${trend}`}>
          {trend === "up" ? "↗" : "↘"} {change}
        </span>
        <span>{foot}</span>
      </div>
      <div className="stat-sparkline">
        <i />
      </div>
    </div>
  );
}

function TaskTableRow({ task: t }) {
  const who =
    t.employeeName || t.assignedEmployee?.fullName || "Former employee";
  return (
    <tr>
      <td>
        <input type="checkbox" aria-label={`Select ${t.title}`} />
      </td>
      <td>
        <Link className="table-task-name" to={`/tasks/${t._id}`}>
          <span
            className={`task-check ${t.status === "Completed" ? "checked" : ""}`}
          >
            {t.status === "Completed" ? <Check size={12} /> : ""}
          </span>
          <span>
            <b>{t.title}</b>
            <small>{t.description}</small>
          </span>
        </Link>
      </td>
      <td>
        <Link to={`/employees/${t.employeeId}`} className="assignee-cell">
          <Avatar name={who} size="small" />
          <span>{who}</span>
        </Link>
      </td>
      <td>
        <span className="department-cell">
          <i />
          {t.department}
        </span>
      </td>
      <td>
        <PriorityBadge priority={t.priority} />
      </td>
      <td>
        <StatusBadge status={t.status} />
      </td>
      <td className={isOverdue(t) ? "date-overdue" : ""}>
        {isOverdue(t) && <span className="overdue-dot" />}
        {new Date(`${t.dueDate}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
      <td>
        <Link to={`/tasks/${t._id}`} className="row-menu">
          <MoreHorizontal size={18} />
        </Link>
      </td>
    </tr>
  );
}

function FilterSelect({ value, options, label, onChange }) {
  return (
    <label className="filter-select">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} />
    </label>
  );
}

function Pagination({ page, total, size, setPage }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="pagination">
      <span>
        Showing{" "}
        <b>
          {total ? (page - 1) * size + 1 : 0}–{Math.min(page * size, total)}
        </b>{" "}
        of <b>{total}</b> results
      </span>
      <div>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: pages }, (_, i) => (
          <button
            className={i + 1 === page ? "current" : ""}
            key={i}
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button disabled={page >= pages} onClick={() => setPage(page + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function FormField({ label, error, wide, children }) {
  return (
    <label className={`form-field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

function Restricted({ status }) {
  return (
    <div className="page-content">
      <Link to="/tasks" className="back-link">
        <ArrowLeft size={16} /> Back to tasks
      </Link>
      <div className="panel detail-panel">
        <div className="empty-state">
          <Check size={25} />
          <b>This task is {status.toLowerCase()}</b>
          <span>Completed and cancelled tasks cannot be edited.</span>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <b>{value || "—"}</b>
    </div>
  );
}

function NotFound({ type }) {
  return (
    <div className="page-content">
      <div className="panel detail-panel">
        <div className="empty-state">
          <CircleHelp size={25} />
          <b>{type} not found</b>
          <Link to={`/${type === "task" ? "tasks" : "employees"}`}>
            Back to {type}s
          </Link>
        </div>
      </div>
    </div>
  );
}

export {
  PageTitle,
  Button,
  Avatar,
  StatusBadge,
  PriorityBadge,
  TaskRow,
  StatCard,
  TaskTableRow,
  FilterSelect,
  Pagination,
  FormField,
  Restricted,
  Info,
  NotFound,
};

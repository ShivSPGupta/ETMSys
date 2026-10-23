/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { dashboardApi } from "../../api/dashboardApi.js";
import { getErrorMessage } from "../../api/axios.js";
import { Avatar, Button, PageTitle } from "../../components/common/index.jsx";

const employeeStats = [
  {
    key: "employees",
    label: "Total Employees",
    color: "neutral",
    link: "/employees",
  },
  {
    key: "activeEmployees",
    label: "Active Members",
    color: "green",
    link: "/employees?status=Active",
  },
  {
    key: "inactiveEmployees",
    label: "Inactive Members",
    color: "gray",
    link: "/employees?status=Inactive",
  },
  {
    key: "onLeaveEmployees",
    label: "On Leave",
    color: "amber",
    link: "/employees?status=On%20Leave",
  },
];

const taskStats = [
  { key: "total", label: "Total Tasks", color: "neutral", link: "/tasks" },
  { key: "todo", label: "Todo", color: "gray", link: "/tasks?status=Todo" },
  {
    key: "inProgress",
    label: "In Progress",
    color: "blue",
    link: "/tasks?status=In%20Progress",
  },
  {
    key: "completed",
    label: "Completed",
    color: "green",
    link: "/tasks?status=Completed",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    color: "brown",
    link: "/tasks?status=Cancelled",
  },
  {
    key: "overdue",
    label: "Overdue",
    color: "red",
    link: "/tasks",
  },
];

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.get();
      setData(res);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load dashboard data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const counts = data?.counts || {};
  const workload = data?.workload || [];

  return (
    <div className="page-content dashboard-page">
      <PageTitle
        eyebrow="WORKSPACE / OVERVIEW"
        title="Dashboard"
        subtitle="Monitor team availability, organizational workload, and task distribution in real time."
        action={
          <div className="header-actions">
            <Button to="/tasks/new" icon={Plus}>
              Add Task
            </Button>
            <Button to="/employees/new" variant="secondary" icon={Plus}>
              Add Employee
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="panel error-banner">
          <p className="error-banner-text">{error}</p>
          <button className="button primary" onClick={fetchDashboard}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="dashboard-section-label">
        <b>Team Availability & Status</b>
        <span>{counts.employees ?? 0} Total Staff</span>
      </div>
      <section
        className="dashboard-stat-grid employee-stat-grid"
        aria-label="Employee counts"
      >
        {employeeStats.map((stat) => (
          <Link
            to={stat.link}
            className="dashboard-stat-card stat-link"
            key={stat.key}
          >
            <span>{stat.label}</span>
            <strong className={`dashboard-stat-value ${stat.color}`}>
              {loading && !data ? "—" : counts[stat.key] ?? 0}
            </strong>
          </Link>
        ))}
      </section>

      <div className="dashboard-section-label">
        <b>Task Status Breakdown</b>
        <span>{counts.total ?? 0} Total Tasks Tracked</span>
      </div>
      <section
        className="dashboard-stat-grid task-stat-grid"
        aria-label="Task counts"
      >
        {taskStats.map((stat) => (
          <Link
            to={stat.link}
            className="dashboard-stat-card stat-link"
            key={stat.key}
          >
            <span>{stat.label}</span>
            <strong className={`dashboard-stat-value ${stat.color}`}>
              {loading && !data ? "—" : counts[stat.key] ?? 0}
            </strong>
          </Link>
        ))}
      </section>

      <section className="panel list-panel dashboard-workload-panel">
        <div className="list-panel-heading">
          <div>
            <b>Employee Workload & Capacity</b>
            <span className="count-pill">
              {workload.length} Active Members
            </span>
            {loading && (
              <small className="table-updating-indicator">
                Updating...
              </small>
            )}
          </div>
          <span className="employees-active">
            Capacity limit: maximum 3 active tasks per employee
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>DEPARTMENT</th>
                <th>ACTIVE TASKS</th>
                <th>CAPACITY UTILIZATION</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading && !workload.length ? (
                <tr>
                  <td colSpan="6" className="table-empty-cell">
                    Loading employee workload...
                  </td>
                </tr>
              ) : workload.length ? (
                workload.map((emp) => {
                  const pct = Math.min(100, Math.round(((emp.activeTasks || 0) / 3) * 100));
                  const stateClass =
                    emp.activeTasks >= 3
                      ? "full"
                      : emp.activeTasks === 2
                        ? "warning"
                        : "available";
                  const stateLabel =
                    emp.activeTasks >= 3
                      ? "At Capacity"
                      : emp.activeTasks === 2
                        ? "Near Limit"
                        : "Available";

                  return (
                    <tr key={emp.employeeId}>
                      <td>
                        <Link
                          to={`/employees/${emp.employeeId}`}
                          className="assignee-cell"
                        >
                          <Avatar name={emp.fullName} size="small" />
                          <span>
                            <b>{emp.fullName}</b>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <span className="department-cell">
                          <i />
                          {emp.department || "General"}
                        </span>
                      </td>
                      <td>
                        <b>{emp.activeTasks}</b>{" "}
                        <small className="empty-text-note">/ 3 active</small>
                      </td>
                      <td className="capacity-cell">
                        <span className="capacity-pct">
                          {pct}%
                        </span>
                        <span className="capacity-track">
                          <span
                            className={`capacity-fill ${stateClass}`}
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                      </td>
                      <td>
                        <span className={`capacity-pill ${stateClass}`}>
                          {stateLabel}
                        </span>
                      </td>
                      <td>
                        <div className="workload-action-group">
                          <Link
                            to={`/tasks?search=${encodeURIComponent(emp.fullName)}`}
                            className="workload-action-link primary"
                          >
                            View tasks
                          </Link>
                          {emp.activeTasks < 3 ? (
                            <Link
                              to="/tasks/new"
                              className="workload-action-link assign"
                            >
                              Assign task
                            </Link>
                          ) : (
                            <span
                              className="workload-action-disabled"
                              title="Employee is at maximum capacity (3 active tasks)."
                            >
                              Max capacity
                            </span>
                          )}
                          <Link
                            to={`/employees/${emp.employeeId}`}
                            className="workload-action-link profile"
                          >
                            Profile
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="table-empty-cell">
                    No active employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;

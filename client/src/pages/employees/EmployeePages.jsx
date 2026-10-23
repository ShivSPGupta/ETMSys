/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowDownUp,
  ArrowLeft,
  ChevronRight,
  ListFilter,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { departments, employeeStatuses, today } from "../../utils/constants.js";
import { employeeApi } from "../../api/employeeApi.js";
import { taskApi } from "../../api/taskApi.js";
import { getErrorMessage } from "../../api/axios.js";
import EmployeeIdentity from "../../components/employees/EmployeeIdentity.jsx";
import {
  Avatar,
  Button,
  FilterSelect,
  FormField,
  Info,
  NotFound,
  PageTitle,
  Pagination,
  StatusBadge,
  TaskRow,
} from "../../components/common/index.jsx";

const PAGE_SIZE = 8;

function EmployeeList({ notify }) {
  const [params, setParams] = useSearchParams();
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openActionId, setOpenActionId] = useState(null);

  const q = params.get("search") || "";
  const [searchInput, setSearchInput] = useState(q);
  const dept = params.get("department") || "";
  const status = params.get("status") || "";
  const sort = params.get("sort") || "fullName";
  const direction = params.get("direction") || "asc";
  const page = Number(params.get("page") || 1);

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Debounced search input to URL
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

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeeApi.list({
        page,
        limit: PAGE_SIZE,
        search: q,
        department: dept,
        status,
        sort,
        direction,
      });
      setEmployees(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      if (notify) {
        notify(getErrorMessage(err, "Failed to load employees."), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [params]);

  const handleDelete = async (employee) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${employee.fullName}? Historical tasks will retain their employee details.`,
      )
    ) {
      return;
    }
    try {
      await employeeApi.remove(employee._id);
      if (notify) {
        notify("Employee deleted. Historical tasks are preserved.");
      }
      fetchEmployees();
    } catch (err) {
      if (notify) {
        notify(getErrorMessage(err, "Cannot delete employee."), "error");
      }
    }
  };

  return (
    <div className="page-content">
      <PageTitle
        eyebrow="WORKSPACE / PEOPLE"
        title="Employees"
        subtitle="Manage your people, view workloads, and track team status."
        action={
          <Button to="/employees/new" icon={Plus}>
            Add employee
          </Button>
        }
      />

      <div className="list-toolbar reference-toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            placeholder="Search name, ID, or email..."
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
          <Button to="/employees/new" icon={Plus}>
            Add Employee
          </Button>
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
          value={status}
          options={["", ...employeeStatuses]}
          label="Status"
          onChange={(v) => setFilter("status", v)}
        />
        {(q || dept || status) && (
          <button
            className="button secondary"
            style={{ height: "27px", fontSize: "10px", padding: "0 8px" }}
            onClick={() => setParams(new URLSearchParams())}
          >
            Clear filters
          </button>
        )}
      </div>

      <section className="panel list-panel">
        <div className="list-panel-heading">
          <div>
            <b>All employees</b>
            <span className="count-pill">{total}</span>
            {loading && <small style={{ marginLeft: "8px", color: "#888" }}>Updating...</small>}
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  EMPLOYEE{" "}
                  <button
                    onClick={() => toggleSort("fullName")}
                    style={{ background: "none", border: 0, color: "inherit", cursor: "pointer" }}
                    aria-label="Sort by Name"
                  >
                    <ArrowDownUp size={11} />
                  </button>
                </th>
                <th>
                  EMPLOYEE ID{" "}
                  <button
                    onClick={() => toggleSort("employeeId")}
                    style={{ background: "none", border: 0, color: "inherit", cursor: "pointer" }}
                    aria-label="Sort by Employee ID"
                  >
                    <ArrowDownUp size={11} />
                  </button>
                </th>
                <th>
                  DEPARTMENT{" "}
                  <button
                    onClick={() => toggleSort("department")}
                    style={{ background: "none", border: 0, color: "inherit", cursor: "pointer" }}
                    aria-label="Sort by Department"
                  >
                    <ArrowDownUp size={11} />
                  </button>
                </th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>
                  JOINED{" "}
                  <button
                    onClick={() => toggleSort("joiningDate")}
                    style={{ background: "none", border: 0, color: "inherit", cursor: "pointer" }}
                    aria-label="Sort by Joining Date"
                  >
                    <ArrowDownUp size={11} />
                  </button>
                </th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading && !employees.length ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "28px" }}>
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length ? (
                employees.map((e) => (
                  <tr key={e._id}>
                    <td>
                      <EmployeeIdentity employee={e} />
                    </td>
                    <td className="muted-cell">{e.employeeId}</td>
                    <td>
                      <span className="department-cell">
                        <i />
                        {e.department}
                      </span>
                    </td>
                    <td>{e.role}</td>
                    <td>
                      <StatusBadge status={e.status} />
                    </td>
                    <td>
                      {new Date(`${e.joiningDate}T00:00:00`).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <details
                        className="row-actions"
                        open={openActionId === e._id}
                      >
                        <summary
                          aria-label={`Actions for ${e.fullName}`}
                          onClick={(ev) => {
                            ev.preventDefault();
                            setOpenActionId((curr) => (curr === e._id ? null : e._id));
                          }}
                        >
                          <MoreHorizontal size={18} />
                        </summary>
                        <div className="row-actions-menu">
                          <Link
                            to={`/employees/${e._id}`}
                            onClick={() => setOpenActionId(null)}
                          >
                            View profile
                          </Link>
                          <Link
                            to={`/employees/${e._id}/edit`}
                            onClick={() => setOpenActionId(null)}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => {
                              setOpenActionId(null);
                              handleDelete(e);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <ListFilter size={24} />
                      <b>No employees found</b>
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

function EmployeeForm({ notify }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    employeeId: "",
    fullName: "",
    email: "",
    phone: "",
    department: "Development",
    role: "",
    joiningDate: today,
    status: "Active",
    skills: [],
    leaveStart: "",
    leaveEnd: "",
  });

  const [skill, setSkill] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (id) {
      setLoading(true);
      employeeApi
        .get(id)
        .then((emp) => {
          setForm({
            employeeId: emp.employeeId || "",
            fullName: emp.fullName || "",
            email: emp.email || "",
            phone: emp.phone || "",
            department: emp.department || "Development",
            role: emp.role || "",
            joiningDate: emp.joiningDate || today,
            status: emp.status || "Active",
            skills: emp.skills || [],
            leaveStart: emp.leaveStart || "",
            leaveEnd: emp.leaveEnd || "",
          });
        })
        .catch((err) => {
          if (notify) {
            notify(getErrorMessage(err, "Employee not found."), "error");
          }
          navigate("/employees");
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.employeeId.trim()) errs.employeeId = "Employee ID is required.";
    if (!form.fullName.trim()) errs.fullName = "Full name is required.";
    if (!form.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errs.email = "Enter a valid email address.";
    }
    if (form.phone && !/^\+?[\d\s().-]{7,20}$/.test(form.phone)) {
      errs.phone = "Enter a valid phone number.";
    }
    if (!form.role.trim()) errs.role = "Role is required.";
    if (!form.joiningDate) errs.joiningDate = "Joining date is required.";
    if (!departments.includes(form.department)) {
      errs.department = "Choose a valid department.";
    }
    if (!employeeStatuses.includes(form.status)) {
      errs.status = "Choose a valid employee status.";
    }
    if (form.status === "On Leave") {
      if (!form.leaveStart) errs.leaveStart = "Leave start date is required.";
      if (!form.leaveEnd) errs.leaveEnd = "Leave end date is required.";
      if (form.leaveStart && form.leaveEnd && form.leaveEnd < form.leaveStart) {
        errs.leaveEnd = "Leave end cannot be earlier than leave start.";
      }
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
      ...form,
      employeeId: form.employeeId.trim(),
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role.trim(),
      phone: form.phone.trim(),
      skills: form.skills || [],
    };

    if (payload.status !== "On Leave") {
      delete payload.leaveStart;
      delete payload.leaveEnd;
    }

    try {
      if (id) {
        await employeeApi.update(id, payload);
        if (notify) notify("Employee details updated.");
      } else {
        await employeeApi.create(payload);
        if (notify) notify("Employee added successfully.");
      }
      navigate("/employees");
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to save employee.");
      if (notify) notify(msg, "error");
      if (msg.toLowerCase().includes("employee id")) {
        setErrors((prev) => ({ ...prev, employeeId: msg }));
      } else if (msg.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: msg }));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content form-page">
        <div style={{ textAlign: "center", padding: "40px" }}>Loading employee...</div>
      </div>
    );
  }

  return (
    <div className="page-content form-page">
      <Link to="/employees" className="back-link">
        <ArrowLeft size={16} /> Back to employees
      </Link>
      <PageTitle
        eyebrow="PEOPLE / EMPLOYEE"
        title={id ? "Edit employee" : "Add employee"}
        subtitle={
          id
            ? "Update profile, department, contact, and leave status."
            : "Add a new member to your workspace."
        }
      />
      <form className="panel form-panel" onSubmit={submit}>
        <div className="form-section-title">
          <span className="section-icon">
            <Users size={17} />
          </span>
          <div>
            <b>Personal information</b>
            <p>Basic details for this employee.</p>
          </div>
        </div>

        <div className="form-grid">
          <FormField label="Employee ID" error={errors.employeeId}>
            <input
              name="employeeId"
              value={form.employeeId}
              onChange={change}
              placeholder="e.g. EMP-009"
              disabled={saving}
            />
          </FormField>

          <FormField label="Full name" error={errors.fullName}>
            <input
              name="fullName"
              value={form.fullName}
              onChange={change}
              placeholder="e.g. Alex Morgan"
              disabled={saving}
            />
          </FormField>

          <FormField label="Email address" error={errors.email}>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={change}
              placeholder="name@company.com"
              disabled={saving}
            />
          </FormField>

          <FormField label="Phone number" error={errors.phone}>
            <input
              name="phone"
              value={form.phone}
              onChange={change}
              placeholder="+1 (555) 000-0000"
              disabled={saving}
            />
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

          <FormField label="Job title / Role" error={errors.role}>
            <input
              name="role"
              value={form.role}
              onChange={change}
              placeholder="e.g. Product Designer"
              disabled={saving}
            />
          </FormField>

          <FormField label="Joining date" error={errors.joiningDate}>
            <input
              type="date"
              name="joiningDate"
              value={form.joiningDate}
              onChange={change}
              disabled={saving}
            />
          </FormField>

          <FormField label="Employment status" error={errors.status}>
            <select
              name="status"
              value={form.status}
              onChange={change}
              disabled={saving}
            >
              {employeeStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FormField>

          {form.status === "On Leave" && (
            <>
              <FormField label="Leave start" error={errors.leaveStart}>
                <input
                  type="date"
                  name="leaveStart"
                  value={form.leaveStart || ""}
                  onChange={change}
                  disabled={saving}
                />
              </FormField>
              <FormField label="Leave end" error={errors.leaveEnd}>
                <input
                  type="date"
                  name="leaveEnd"
                  value={form.leaveEnd || ""}
                  onChange={change}
                  disabled={saving}
                />
              </FormField>
            </>
          )}

          <FormField label="Skills" wide>
            <div className="skill-input">
              <input
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (skill.trim() && !form.skills?.includes(skill.trim())) {
                      setForm({
                        ...form,
                        skills: [...(form.skills || []), skill.trim()],
                      });
                      setSkill("");
                    }
                  }
                }}
                placeholder="Type a skill and press Enter"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => {
                  if (skill.trim() && !form.skills?.includes(skill.trim())) {
                    setForm({
                      ...form,
                      skills: [...(form.skills || []), skill.trim()],
                    });
                    setSkill("");
                  }
                }}
              >
                <Plus size={15} /> Add
              </button>
            </div>
            <div className="skill-list" style={{ marginTop: "6px" }}>
              {(form.skills || []).map((s, i) => (
                <span key={`${s}-${i}`}>
                  {s}
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        skills: form.skills.filter((_, j) => i !== j),
                      })
                    }
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </FormField>
        </div>

        <div className="form-footer">
          <Link className="button secondary" to="/employees">
            Cancel
          </Link>
          <button className="button primary" disabled={saving}>
            {saving ? "Saving…" : id ? "Save changes" : "Add employee"}{" "}
            <ChevronRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

function EmployeeView({ notify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [empRes, taskRes] = await Promise.all([
        employeeApi.get(id),
        taskApi.list({ employee: id, limit: 100 }),
      ]);
      setEmployee(empRes);
      setTasks(taskRes.data || []);
    } catch (err) {
      if (notify) {
        notify(getErrorMessage(err, "Employee not found."), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="page-content detail-page">
        <div style={{ textAlign: "center", padding: "40px" }}>Loading profile...</div>
      </div>
    );
  }

  if (!employee) {
    return <NotFound type="employee" />;
  }

  const activeTasks = tasks.filter((t) => ["Todo", "In Progress"].includes(t.status));
  const completedTasks = tasks.filter((t) => t.status === "Completed");

  const remove = async () => {
    if (activeTasks.length > 0) {
      if (notify) {
        notify(
          "This employee still has Todo or In Progress tasks. Reassign or finish them before deletion.",
          "error",
        );
      }
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${employee.fullName}? Historical tasks will retain their employee details.`,
      )
    ) {
      return;
    }

    try {
      await employeeApi.remove(id);
      if (notify) {
        notify("Employee deleted. Historical tasks are preserved.");
      }
      navigate("/employees");
    } catch (err) {
      if (notify) {
        notify(getErrorMessage(err, "Cannot delete employee."), "error");
      }
    }
  };

  return (
    <div className="page-content detail-page">
      <Link to="/employees" className="back-link">
        <ArrowLeft size={16} /> Back to employees
      </Link>

      <PageTitle
        eyebrow="PEOPLE / EMPLOYEE PROFILE"
        title={employee.fullName}
        subtitle={`${employee.role} · ${employee.department}`}
        action={
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              to={`/employees/${id}/edit`}
              variant="secondary"
              icon={Settings}
            >
              Edit profile
            </Button>
            <Button variant="secondary" icon={Trash2} onClick={remove}>
              Delete
            </Button>
          </div>
        }
      />

      <div className="employee-profile panel">
        <Avatar name={employee.fullName} size="large" />
        <div className="employee-profile-info">
          <h2>{employee.fullName}</h2>
          <p>
            {employee.role} · {employee.department}
          </p>
          <StatusBadge status={employee.status} />
          {employee.status === "On Leave" && employee.leaveStart && employee.leaveEnd && (
            <small style={{ display: "block", marginTop: "4px", color: "#ba8739" }}>
              Leave: {employee.leaveStart} to {employee.leaveEnd}
            </small>
          )}
        </div>
        <div className="employee-profile-stat">
          <b>{activeTasks.length} / 3</b>
          <span>Active tasks (Max 3)</span>
        </div>
        <div className="employee-profile-stat">
          <b>{completedTasks.length}</b>
          <span>Completed</span>
        </div>
      </div>

      <div className="detail-layout">
        <section className="panel detail-panel">
          <div className="panel-heading">
            <div>
              <h2>Assigned tasks</h2>
              <p>Work connected to this employee ({tasks.length} total)</p>
            </div>
            {employee.status !== "Inactive" && (
              <Button to="/tasks/new" variant="secondary" icon={Plus}>
                New task
              </Button>
            )}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>TASK</th>
                  <th>PRIORITY</th>
                  <th>STATUS</th>
                  <th>DUE DATE</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tasks.length ? (
                  tasks.map((t) => <TaskRow key={t._id} task={t} />)
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                      No tasks assigned to this employee.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="panel assigned-panel">
          <h3>Employee details</h3>
          <div className="info-list">
            <Info label="Employee ID" value={employee.employeeId} />
            <Info label="Email" value={employee.email} />
            <Info label="Phone" value={employee.phone} />
            <Info label="Department" value={employee.department} />
            <Info label="Joining date" value={employee.joiningDate} />
            {employee.status === "On Leave" && (
              <>
                <Info label="Leave start" value={employee.leaveStart} />
                <Info label="Leave end" value={employee.leaveEnd} />
              </>
            )}
          </div>
          <div className="assigned-divider" />
          <h3>Skills</h3>
          <div className="skill-list">
            {employee.skills?.length ? (
              employee.skills.map((s) => <span key={s}>{s}</span>)
            ) : (
              <small style={{ color: "#999" }}>No skills listed</small>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export { EmployeeList, EmployeeForm, EmployeeView };

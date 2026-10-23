import { useState } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import "./reference.css";
import AppLayout from "./components/layout/AppLayout.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import {
  EmployeeForm,
  EmployeeList,
  EmployeeView,
} from "./pages/employees/EmployeePages.jsx";
import { TaskForm, TaskList, TaskView } from "./pages/tasks/TaskPages.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Workspace />
    </BrowserRouter>
  );
}

function Workspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState(null);

  const page = location.pathname.startsWith("/tasks")
    ? "tasks"
    : location.pathname.startsWith("/employees")
      ? "employees"
      : "dashboard";

  const notify = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  return (
    <AppLayout
      collapsed={collapsed}
      onMenu={() => setCollapsed(!collapsed)}
      page={page}
      onSearch={() => navigate("/tasks")}
      toast={toast}
      onDismiss={() => setToast(null)}
    >
      <Routes>
        <Route path="/" element={<Dashboard notify={notify} />} />
        <Route
          path="/tasks"
          element={<TaskList notify={notify} />}
        />
        <Route
          path="/tasks/new"
          element={<TaskForm notify={notify} />}
        />
        <Route
          path="/tasks/:id/edit"
          element={<TaskForm notify={notify} />}
        />
        <Route
          path="/tasks/:id"
          element={<TaskView notify={notify} />}
        />
        <Route
          path="/employees"
          element={<EmployeeList notify={notify} />}
        />
        <Route
          path="/employees/new"
          element={<EmployeeForm notify={notify} />}
        />
        <Route
          path="/employees/:id/edit"
          element={<EmployeeForm notify={notify} />}
        />
        <Route
          path="/employees/:id"
          element={<EmployeeView notify={notify} />}
        />
        <Route path="*" element={<Dashboard notify={notify} />} />
      </Routes>
    </AppLayout>
  );
}

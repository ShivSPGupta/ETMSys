import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import ToastContainer from "../common/ToastContainer.jsx";

export default function AppLayout({
  collapsed,
  onMenu,
  page,
  onSearch,
  toast,
  onDismiss,
  taskCount,
  children,
}) {
  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} taskCount={taskCount} />
      <main className="main-area">
        <Header page={page} onMenu={onMenu} onSearch={onSearch} />
        {children}
      </main>
      <ToastContainer toast={toast} onDismiss={onDismiss} />
    </div>
  );
}

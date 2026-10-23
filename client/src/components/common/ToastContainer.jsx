import { Check, X } from "lucide-react";

export default function ToastContainer({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type}`} role="status">
      <span className="toast-icon">
        {toast.type === "success" ? <Check size={17} /> : <X size={17} />}
      </span>
      {toast.message}
      <button onClick={onDismiss} aria-label="Dismiss notification">
        <X size={15} />
      </button>
    </div>
  );
}

import { Check, Info, Sparkles, X } from "lucide-react";
import type { Toast } from "../studio/hooks/use-toasts";

const ICONS = {
  success: <Check size={16} />,
  error: <Info size={16} />,
  info: <Sparkles size={16} />,
};

export default function ToastMessage({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`toast toast-${toast.type}`}
      role={toast.type === "error" ? "alert" : "status"}
    >
      {ICONS[toast.type]}
      <span>{toast.message}</span>
      <button onClick={onDismiss} aria-label="通知を閉じる">
        <X size={14} />
      </button>
    </div>
  );
}

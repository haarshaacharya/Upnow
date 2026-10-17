import React from "react";
import { CheckIcon, CloseIcon } from "./Icons";

export function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="vercel-toast-stack">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`vercel-toast vercel-toast-${toast.type || "info"}`}
        >
          <div className="toast-icon-wrap">
            {toast.type === "success" ? (
              <CheckIcon size={14} />
            ) : toast.type === "error" ? (
              <CloseIcon size={14} />
            ) : (
              <span className="toast-dot" />
            )}
          </div>
          <div className="toast-content">
            {toast.title && <strong className="toast-title">{toast.title}</strong>}
            <span className="toast-message">{toast.message}</span>
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => removeToast(toast.id)}
            aria-label="Close notification"
          >
            <CloseIcon size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

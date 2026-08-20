import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type: Toast['type'], action?: Toast['action']) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'], action?: Toast['action']) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type, action }]);
    if (!action) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast, ToastProvider içinde kullanılmalı');
  return ctx;
}

function ToastContainer({ toasts, onHide }: { toasts: Toast[]; onHide: (id: string) => void }) {
  if (toasts.length === 0) return null;

  const typeStyles: Record<Toast['type'], string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-600',
    info: 'bg-blue-600',
  };

  const typeIcons: Record<Toast['type'], string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className="toast-container" style={{
      position: 'fixed',
      top: 'var(--space-4)',
      right: 'var(--space-4)',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      pointerEvents: 'none',
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${typeStyles[toast.type]}`}
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderLeft: `4px solid var(--color-${toast.type === 'success' ? 'success' : toast.type === 'error' ? 'danger' : toast.type === 'warning' ? 'warning' : 'info'})`,
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            minWidth: 280,
            maxWidth: 400,
            pointerEvents: 'auto',
            animation: 'slideIn 0.3s ease',
            color: 'var(--color-text-primary)',
          }}
        >
          <span style={{ fontWeight: 'bold' }}>{typeIcons[toast.type]}</span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          {toast.action ? (
            <button
              onClick={() => {
                toast.action?.onClick();
                onHide(toast.id);
              }}
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-1) var(--space-3)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {toast.action.label}
            </button>
          ) : (
            <button
              onClick={() => onHide(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-tertiary)',
                cursor: 'pointer',
                padding: 'var(--space-1)',
              }}
              aria-label="Kapat"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
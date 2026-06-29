import { useToastStore } from '@/store/useToastStore';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-slide-in
            ${
              toast.type === 'success'
                ? 'bg-success/15 border-success/35 text-success'
                : toast.type === 'error'
                ? 'bg-danger/15 border-danger/35 text-danger'
                : 'bg-surface/85 border-surface-border text-foreground'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <span>
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-foreground-subtle hover:text-foreground transition-colors text-xs"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

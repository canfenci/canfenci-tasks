import { RefreshCw, X } from 'lucide-react';

interface UpdateToastProps {
  onRefresh: () => void;
  onDismiss: () => void;
}

export function UpdateToast({ onRefresh, onDismiss }: UpdateToastProps) {
  return (
    <div className="update-toast">
      <span>Yeni bir sürüm mevcut.</span>
      <div className="update-toast-actions">
        <button onClick={onRefresh} className="update-toast-btn">
          <RefreshCw size={14} /> Güncelle
        </button>
        <button onClick={onDismiss} className="update-toast-dismiss" aria-label="Kapat">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

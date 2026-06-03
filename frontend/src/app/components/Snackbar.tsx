import { useEffect } from 'react';
import { Check, X, Info, AlertTriangle } from 'lucide-react';

interface SnackbarProps {
  isOpen: boolean;
  message: string;
  variant?: 'success' | 'error' | 'info' | 'warning';
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  duration?: number;
}

export function Snackbar({
  isOpen,
  message,
  variant = 'info',
  actionLabel,
  onAction,
  onClose,
  duration = 4000,
}: SnackbarProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <Check className="w-5 h-5" />;
      case 'error':
        return <X className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#FF5252';
      case 'warning':
        return '#FBBC04';
      case 'info':
      default:
        return '#4285F4';
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
      <div
        className="bg-[var(--md3-on-surface)] text-white rounded px-4 py-3.5 shadow-lg flex items-center gap-3 min-w-[480px]"
        style={{
          borderLeft: `3px solid ${getBorderColor()}`,
          boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ color: getBorderColor() }}>{getIcon()}</div>
        <p className="text-sm font-medium flex-1">{message}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="text-sm font-medium hover:underline"
            style={{ color: '#80BAFF' }}
          >
            {actionLabel}
          </button>
        )}
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

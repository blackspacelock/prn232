import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      gap={8}
      toastOptions={{
        className: 'sonner-toast',
      }}
    />
  );
}

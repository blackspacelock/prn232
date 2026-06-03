import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ToastProvider } from './components/ToastProvider';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  const initFromStorage = useAuthStore((s) => s.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastProvider />
    </>
  );
}

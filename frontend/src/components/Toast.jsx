import { useState, useCallback } from 'react';

let toastTimeout;

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => setToast(null), 3000);
  }, []);

  return { toast, showToast };
}

export function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

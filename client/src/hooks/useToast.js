import { useState, useCallback } from 'react';

let idSeq = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = ++idSeq;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const dismiss = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);

  return { toasts, toast, dismiss };
}

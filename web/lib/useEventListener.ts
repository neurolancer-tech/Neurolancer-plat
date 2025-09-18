import { useEffect } from 'react';

export function useEventListener(eventName: string, handler: (e: Event) => void) {
  useEffect(() => {
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [eventName, handler]);
}


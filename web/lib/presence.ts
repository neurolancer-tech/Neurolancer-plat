// Simple presence utility shared across the app
// Stores status in localStorage and broadcasts via window events + storage events

const KEY = 'online_status';
const EVT = 'presence-changed';

export type PresenceListener = (online: boolean) => void;

export function getOnlineStatus(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(KEY) !== 'offline';
  } catch {
    return true;
  }
}

export function setOnlineStatus(online: boolean) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, online ? 'online' : 'offline');
    const ev = new CustomEvent(EVT, { detail: { online } });
    window.dispatchEvent(ev);
  } catch {}
}

export function subscribePresence(listener: PresenceListener): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: any) => listener(!!(e?.detail?.online ?? getOnlineStatus()));
  const storageHandler = (e: StorageEvent) => {
    if (e.key === KEY) listener(getOnlineStatus());
  };
  window.addEventListener(EVT, handler as EventListener);
  window.addEventListener('storage', storageHandler);
  // Initial emit
  setTimeout(() => listener(getOnlineStatus()), 0);
  return () => {
    window.removeEventListener(EVT, handler as EventListener);
    window.removeEventListener('storage', storageHandler);
  };
}


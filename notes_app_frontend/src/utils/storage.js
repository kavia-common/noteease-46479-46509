// PUBLIC_INTERFACE
export function safeParse(json, fallback) {
  /** Safely parse JSON with a fallback. */
  try {
    if (json === null || json === "") return fallback;
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// PUBLIC_INTERFACE
export function readLocal(key, fallback = null) {
  /** Read from localStorage with try/catch. */
  try {
    const raw = localStorage.getItem(key);
    return safeParse(raw, fallback);
  } catch {
    return fallback;
  }
}

// PUBLIC_INTERFACE
export function writeLocal(key, value) {
  /** Write to localStorage with try/catch. */
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const NAMESPACE = 'noteease.notes.v1';

// PUBLIC_INTERFACE
export function getNotes() {
  /** Get notes array from namespaced storage. */
  return readLocal(NAMESPACE, []);
}

// PUBLIC_INTERFACE
export function saveNotes(notes) {
  /** Persist notes array to namespaced storage. */
  return writeLocal(NAMESPACE, notes);
}

// PUBLIC_INTERFACE
export function nowISO() {
  /** Return current ISO timestamp. */
  return new Date().toISOString();
}

// PUBLIC_INTERFACE
export function formatTimeAgo(isoString) {
  /** Basic "time ago" formatter with fallback to locale string. */
  try {
    const then = new Date(isoString).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((now - then) / 1000));
    if (diff < 60) return 'just now';
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(isoString).toLocaleString();
  } catch {
    return new Date(isoString).toLocaleString();
  }
}

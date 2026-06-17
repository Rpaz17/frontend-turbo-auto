// Almacenamiento del JWT. Estrategia: en memoria (variable del módulo) con
// respaldo en sessionStorage. sessionStorage se borra al cerrar la pestaña y
// tiene menor superficie de exposición que localStorage. Toda lectura/escritura
// del token pasa por aquí, de forma que solo hay un punto que tocar.

const STORAGE_KEY = 'turbo-auto-jwt';

let memoryToken: string | null = null;

function readSession(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (memoryToken !== null) return memoryToken;
  memoryToken = readSession();
  return memoryToken;
}

export function setToken(token: string): void {
  memoryToken = token;
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    /* sessionStorage no disponible: el token queda solo en memoria */
  }
}

export function clearToken(): void {
  memoryToken = null;
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export function hasToken(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    if (decoded.exp) {
      const isExpired = Date.now() >= decoded.exp * 1000;
      if (isExpired) {
        clearToken();
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function getUserIdFromToken(): string {
  const token = getToken();
  if (!token) return '1';
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return String(decoded.id ?? decoded.sub ?? '1');
  } catch {
    return '1';
  }
}

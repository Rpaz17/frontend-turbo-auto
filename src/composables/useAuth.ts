import { ref } from 'vue';
import { login as loginRequest, logout as logoutRequest } from '../api/auth';
import { hasToken } from '../lib/token';
import { ApiError } from '../lib/http';
import type { AuthCredentials } from '../api/schemas';

// Estado de sesión compartido entre todos los usos del composable.
const authenticated = ref(hasToken());

/**
 * Composable de autenticación (equivalente a un hook useAuth).
 * Expone el estado de sesión y las acciones de login/logout.
 */
export function useAuth() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function login(credentials: AuthCredentials): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      await loginRequest(credentials);
      authenticated.value = true;
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        error.value = err.status === 401 ? 'Credenciales inválidas. Intenta de nuevo.' : err.message;
      } else if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'No se pudo iniciar sesión.';
      }
      authenticated.value = false;
      return false;
    } finally {
      loading.value = false;
    }
  }

  function logout(): void {
    logoutRequest();
    authenticated.value = false;
  }

  return {
    isAuthenticated: authenticated,
    loading,
    error,
    login,
    logout,
  };
}

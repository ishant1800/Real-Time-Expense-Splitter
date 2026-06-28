import { useMutation } from '@tanstack/react-query';
import { authApi } from '../services/authApi';
import { useAuthStore } from '../store/useAuthStore';

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: Record<string, string>) => authApi.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (details: Record<string, string>) => authApi.register(details),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
    },
  });
}

export function useLogoutMutation() {
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        try {
          await authApi.logout(refreshToken);
        } catch (error) {
          console.error('Logout API failure:', error);
        }
      }
    },
    onSettled: () => {
      logout();
    },
  });
}

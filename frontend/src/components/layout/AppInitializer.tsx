import { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { authApi } from '../../services/authApi';

interface AppInitializerProps {
  children: React.ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const { accessToken, setAuth, logout, setChecking, isChecking } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      if (!accessToken) {
        logout();
        setChecking(false);
        return;
      }

      try {
        // Run verification request. If accessToken is expired, axios response interceptor
        // will intercept 401, refresh tokens, and successfully resolve this call.
        const user = await authApi.getMe();
        const refreshToken = useAuthStore.getState().refreshToken || '';
        const activeAccessToken = useAuthStore.getState().accessToken || accessToken;
        setAuth(user, activeAccessToken, refreshToken);
      } catch (error) {
        console.error('Auth verification failed during app init:', error);
        logout();
      } finally {
        setChecking(false);
      }
    };

    initializeAuth();
  }, [accessToken, setAuth, logout, setChecking]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center animate-fade-in">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
        <p className="text-sm text-foreground-muted">Loading your session...</p>
      </div>
    );
  }

  return <>{children}</>;
}

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';

interface AppInitializerProps {
  children: React.ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!refreshToken) {
        setIsInitializing(false);
        return;
      }

      try {
        // Run refresh using raw axios to avoid interceptor loop
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken, user } = res.data.data;
        setAuth(user, accessToken, newRefreshToken);
      } catch (error) {
        console.error('Silent token refresh failed at app init:', error);
        logout();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [refreshToken, setAuth, logout]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
        <p className="text-sm text-foreground-muted">Loading your session...</p>
      </div>
    );
  }

  return <>{children}</>;
}

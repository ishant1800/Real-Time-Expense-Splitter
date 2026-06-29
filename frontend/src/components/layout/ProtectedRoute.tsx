import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export function ProtectedRoute() {
  const { isAuthenticated, isChecking } = useAuthStore();

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center animate-fade-in">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
        <p className="text-sm text-foreground-muted">Loading your session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

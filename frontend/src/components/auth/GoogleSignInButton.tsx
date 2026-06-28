import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/authApi';
import { useAuthStore } from '../../store/useAuthStore';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';

interface GoogleSignInButtonProps {
  className?: string;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

// Preset mock profiles for easy local testing
const MOCK_PROFILES = [
  { name: 'Sarah Connor', email: 'sarah.c@gmail.com', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
  { name: 'Bruce Wayne', email: 'bruce@waynecorp.com', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
  { name: 'Clark Kent', email: 'clark@dailyplanet.com', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
];

export function GoogleSignInButton({ className, onError }: GoogleSignInButtonProps) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  // Check if real Google Auth is configured (we're not using dummy IDs)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_google_client_id_for_dev_mode';
  const isMockMode = googleClientId === 'dummy_google_client_id_for_dev_mode';

  // Google Sign-In mutation
  const googleMutation = useMutation({
    mutationFn: (idToken: string) => authApi.googleLogin(idToken),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    },
    onError: (err: any) => {
      onError?.(err.response?.data?.message || err.message || 'Google Sign-In failed');
    },
  });

  // 1. Initialise REAL Google Identity Services SDK if not in mock mode
  useEffect(() => {
    if (isMockMode) return;

    // Dynamically append the Google script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            if (response.credential) {
              googleMutation.mutate(response.credential);
            }
          },
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-btn-container'),
          { theme: 'dark', size: 'large', width: '100%' }
        );
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, [googleClientId, isMockMode]);

  // 2. Mock handler: Generates simulated JWT token format accepted by dev backend
  const handleMockSignIn = (profile: { name: string; email: string; avatarUrl?: string }) => {
    const mockId = `mock_${profile.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    const mockToken = `mock_token_${mockId}_${profile.email}_${encodeURIComponent(profile.name)}_${profile.avatarUrl ? encodeURIComponent(profile.avatarUrl) : ''}`;
    googleMutation.mutate(mockToken);
    setIsMockModalOpen(false);
  };

  const handleCustomMockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) return;
    handleMockSignIn({ name: customName, email: customEmail });
  };

  if (!isMockMode) {
    return (
      <div 
        id="google-signin-btn-container" 
        className={cn('w-full flex justify-center py-2', className)} 
      />
    );
  }

  // Render a simulated button that opens the Mock User Picker
  return (
    <>
      <button
        type="button"
        onClick={() => setIsMockModalOpen(true)}
        className={cn(
          'w-full flex items-center justify-center gap-3 px-4 py-3 border border-surface-border bg-surface-elevated hover:bg-surface-elevated/70 text-foreground font-semibold rounded-xl text-sm transition-all active:scale-[0.98]',
          className
        )}
      >
        {/* Google Icon logo */}
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.842 1.05 15.085 0 12 0 7.354 0 3.321 2.673 1.341 6.577l3.925 3.188z"
          />
          <path
            fill="#4285F4"
            d="M23.455 12.273c0-.818-.073-1.609-.209-2.373H12v4.582h6.423c-.277 1.482-1.114 2.736-2.373 3.582l3.864 2.991c2.264-2.09 3.541-5.173 3.541-8.782z"
          />
          <path
            fill="#FBBC05"
            d="M5.266 14.235L1.341 17.42A11.968 11.968 0 0 0 12 24c3.082 0 5.836-1.023 7.914-2.782l-3.864-2.991a7.072 7.072 0 0 1-9.518-4.045l-3.925 3.188z"
          />
          <path
            fill="#34A853"
            d="M12 4.909c1.927 0 3.664.664 5.027 1.964l3.541-3.54C18.368 1.464 15.395.773 12 .773a11.97 11.97 0 0 0-10.659 6.582l3.925 3.188A7.072 7.072 0 0 1 12 4.909z"
          />
        </svg>
        Sign in with Google (Dev Mock)
      </button>

      {/* Simulated Google popup */}
      <Modal
        isOpen={isMockModalOpen}
        onClose={() => setIsMockModalOpen(false)}
        title="Simulated Google Accounts"
        subtitle="Developer mock mode is active"
        footer={
          <button 
            type="button" 
            onClick={() => setIsMockModalOpen(false)} 
            className="btn-ghost border border-surface-border text-xs px-3 py-1.5"
          >
            Cancel
          </button>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-foreground-subtle bg-surface-elevated border border-surface-border rounded-xl p-3">
            💡 Select a Google profile to log in with, or write a custom name/email. This simulates token exchange dynamically.
          </p>

          <div className="space-y-2">
            {MOCK_PROFILES.map((p) => (
              <button
                key={p.email}
                type="button"
                onClick={() => handleMockSignIn(p)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-surface-border hover:border-accent/40 bg-surface hover:bg-surface-elevated/50 transition-all text-left"
              >
                <img src={p.avatarUrl} alt={p.name} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-foreground-subtle">{p.email}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-surface-border" />
            <span className="flex-shrink mx-4 text-foreground-subtle text-xs uppercase">Or Custom Account</span>
            <div className="flex-grow border-t border-surface-border" />
          </div>

          <form onSubmit={handleCustomMockSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground-muted">Google Display Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground-muted">Google Email address</label>
              <input
                type="email"
                placeholder="e.g. john@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!customName.trim() || !customEmail.trim()}
              className="w-full btn-primary text-xs py-2 mt-2"
            >
              Sign In with Custom Profile
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
}

import { create } from 'zustand';

interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

// Load initial authentication state from localStorage
const getInitialState = () => {
  try {
    const userStr = localStorage.getItem('user');
    const refresh = localStorage.getItem('refreshToken');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
      user,
      accessToken: null, // access tokens remain in-memory for security
      refreshToken: refresh,
      isAuthenticated: !!refresh,
    };
  } catch (error) {
    console.error('Error loading initial auth state:', error);
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    };
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('refreshToken', refreshToken);
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  updateUser: (updatedUser) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(newUser));
      return { user: newUser };
    });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));

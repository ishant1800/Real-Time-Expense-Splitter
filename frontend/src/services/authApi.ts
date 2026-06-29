import api from './api';

export interface AuthResponseData {
  user: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: async (credentials: Record<string, string>): Promise<AuthResponseData> => {
    const res = await api.post('/auth/login', credentials);
    console.log('auth response:', res.data);
    return res.data.data;
  },

  register: async (details: Record<string, string>): Promise<AuthResponseData> => {
    const res = await api.post('/auth/register', details);
    console.log('auth response:', res.data);
    return res.data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  googleLogin: async (idToken: string): Promise<AuthResponseData> => {
    const res = await api.post('/auth/google', { idToken });
    console.log('auth response:', res.data);
    return res.data.data;
  },

  getMe: async (): Promise<{ _id: string; name: string; email: string; avatarUrl?: string }> => {
    const res = await api.get('/auth/me');
    return res.data.data.user;
  },
};

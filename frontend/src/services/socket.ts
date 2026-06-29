import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

// Strip the /api path segment — Socket.io must connect to the server root, not /api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace(/\/api$/, '');

const accessToken = useAuthStore.getState().accessToken;

export const socket: Socket = io(SOCKET_URL, {
  auth: { token: accessToken },
  autoConnect: false,
});

// Sync token updates (e.g. after refresh or login/logout) and reconnect if active
useAuthStore.subscribe((state) => {
  const token = state.accessToken;
  const currentAuth = socket.auth as { token: string | null } | undefined;
  
  if (!currentAuth || currentAuth.token !== token) {
    socket.auth = { token };
    if (socket.connected) {
      socket.disconnect().connect();
    }
  }
});

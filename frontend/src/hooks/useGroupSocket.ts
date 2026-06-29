/**
 * useGroupSocket — Attaches Socket.io listeners for a specific group room.
 *
 * Design decisions:
 *  - Socket logic is fully isolated from page/component business logic.
 *  - Callers simply provide event handlers; this hook manages connect/disconnect.
 *  - Invalidation of React Query caches is done in the handlers, keeping concerns separate.
 *  - The socket is shared from the singleton in services/socket.ts.
 */
import { useEffect, useRef } from 'react';
import { socket } from '@/services/socket';
import { useAuthStore } from '@/store/useAuthStore';

export type GroupSocketEvents = {
  onExpenseAdded?: (data: unknown) => void;
  onBalanceUpdated?: (data: unknown) => void;
  onSettlementCompleted?: (data: unknown) => void;
};

export function useGroupSocket(groupId: string, handlers: GroupSocketEvents) {
  // Capture latest handlers using a mutable ref to prevent stale closures
  const handlersRef = useRef<GroupSocketEvents>(handlers);
  
  // Keep the ref object synchronous with the latest handlers passed on every render
  handlersRef.current = handlers;

  useEffect(() => {
    if (!groupId) return;

    // Connect if not already connected, attaching bearer authentication
    if (!socket.connected) {
      const token = useAuthStore.getState().accessToken;
      socket.auth = { token };
      socket.connect();
    }

    // Join the group room
    socket.emit('join-group', groupId);

    // Stable proxy listeners that delegate execution to the current ref values
    const handleExpenseAdded = (data: unknown) => {
      handlersRef.current.onExpenseAdded?.(data);
    };

    const handleBalanceUpdated = (data: unknown) => {
      handlersRef.current.onBalanceUpdated?.(data);
    };

    const handleSettlementCompleted = (data: unknown) => {
      handlersRef.current.onSettlementCompleted?.(data);
    };

    const handleConnectError = (err: any) => {
      if (err.message === 'Authentication required' || err.message === 'Invalid or expired token') {
        console.error('Socket authentication failed:', err.message);
        useAuthStore.getState().logout();
      }
    };

    // Register event listeners
    socket.on('connect_error', handleConnectError);
    socket.on('expense-added', handleExpenseAdded);
    socket.on('balance-updated', handleBalanceUpdated);
    socket.on('settlement-completed', handleSettlementCompleted);

    // Cleanup: leave room and remove listeners on unmount / groupId change
    return () => {
      socket.emit('leave-group', groupId);
      socket.off('connect_error', handleConnectError);
      socket.off('expense-added', handleExpenseAdded);
      socket.off('balance-updated', handleBalanceUpdated);
      socket.off('settlement-completed', handleSettlementCompleted);
    };
  }, [groupId]);
}

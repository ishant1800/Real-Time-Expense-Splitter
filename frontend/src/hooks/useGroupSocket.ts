/**
 * useGroupSocket — Attaches Socket.io listeners for a specific group room.
 *
 * Design decisions:
 *  - Socket logic is fully isolated from page/component business logic.
 *  - Callers simply provide event handlers; this hook manages connect/disconnect.
 *  - Invalidation of React Query caches is done in the handlers, keeping concerns separate.
 *  - The socket is shared from the singleton in services/socket.ts.
 */
import { useEffect } from 'react';
import { socket } from '@/services/socket';

export type GroupSocketEvents = {
  onExpenseAdded?: (data: unknown) => void;
  onBalanceUpdated?: (data: unknown) => void;
  onSettlementCompleted?: (data: unknown) => void;
};

export function useGroupSocket(groupId: string, handlers: GroupSocketEvents) {
  useEffect(() => {
    if (!groupId) return;

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    // Join the group room
    socket.emit('join-group', groupId);

    // Register event listeners
    if (handlers.onExpenseAdded) {
      socket.on('expense-added', handlers.onExpenseAdded);
    }
    if (handlers.onBalanceUpdated) {
      socket.on('balance-updated', handlers.onBalanceUpdated);
    }
    if (handlers.onSettlementCompleted) {
      socket.on('settlement-completed', handlers.onSettlementCompleted);
    }

    // Cleanup: leave room and remove listeners on unmount / groupId change
    return () => {
      socket.emit('leave-group', groupId);
      socket.off('expense-added', handlers.onExpenseAdded);
      socket.off('balance-updated', handlers.onBalanceUpdated);
      socket.off('settlement-completed', handlers.onSettlementCompleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);
}

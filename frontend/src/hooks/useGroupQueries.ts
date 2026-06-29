import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi, expenseApi, balanceApi } from '@/services/groupApi';
import type { CreateExpensePayload } from '@/services/groupApi';
import { useToastStore } from '@/store/useToastStore';

// ─── Query Keys (centralised, prevents typos) ─────────────────────────────────
export const groupKeys = {
  all: ['groups'] as const,
  detail: (id: string) => ['groups', id] as const,
  expenses: (id: string) => ['groups', id, 'expenses'] as const,
  balances: (id: string) => ['groups', id, 'balances'] as const,
  settlements: (id: string) => ['groups', id, 'settlements'] as const,
};

// ─── Group Queries ─────────────────────────────────────────────────────────────

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: () => groupApi.getGroup(groupId),
    enabled: !!groupId,
    staleTime: 30_000,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  const toast = useToastStore();
  return useMutation({
    mutationFn: (name: string) => groupApi.createGroup(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      toast.success('Group created');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Failed to create group';
      toast.error(msg);
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  const toast = useToastStore();
  return useMutation({
    mutationFn: (inviteCode: string) => groupApi.joinGroup(inviteCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      toast.success('Joined group successfully');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Failed to join group';
      toast.error(msg);
    },
  });
}

export function useRenameGroup(groupId: string) {
  const qc = useQueryClient();
  const toast = useToastStore();
  return useMutation({
    mutationFn: (name: string) => groupApi.renameGroup(groupId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.all });
      toast.success('Group renamed successfully');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Failed to rename group';
      toast.error(msg);
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  const toast = useToastStore();
  return useMutation({
    mutationFn: (groupId: string) => groupApi.deleteGroup(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      toast.success('Group deleted');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Failed to delete group';
      toast.error(msg);
    },
  });
}

// ─── Expense Queries ───────────────────────────────────────────────────────────

export function useExpenses(groupId: string) {
  return useQuery({
    queryKey: groupKeys.expenses(groupId),
    queryFn: () => expenseApi.listExpenses(groupId),
    enabled: !!groupId,
    staleTime: 15_000,
  });
}

export function useCreateExpense(groupId: string) {
  const qc = useQueryClient();
  const toast = useToastStore();
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => expenseApi.createExpense(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.expenses(groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
      toast.success('Expense added');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Failed to add expense';
      toast.error(msg);
    },
  });
}

export function useDeleteExpense(groupId: string) {
  const qc = useQueryClient();
  const toast = useToastStore();
  return useMutation({
    mutationFn: (expenseId: string) => expenseApi.deleteExpense(expenseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.expenses(groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
      toast.success('Expense deleted');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Failed to delete expense';
      toast.error(msg);
    },
  });
}

// ─── Balance Queries ───────────────────────────────────────────────────────────

export function useBalances(groupId: string) {
  return useQuery({
    queryKey: groupKeys.balances(groupId),
    queryFn: () => balanceApi.getBalances(groupId),
    enabled: !!groupId,
    staleTime: 15_000,
  });
}

export function useSettlements(groupId: string) {
  return useQuery({
    queryKey: groupKeys.settlements(groupId),
    queryFn: () => balanceApi.listSettlements(groupId),
    enabled: !!groupId,
    staleTime: 15_000,
  });
}

export function useCreateSettlement(groupId: string) {
  const qc = useQueryClient();
  const toast = useToastStore();
  return useMutation({
    mutationFn: (payload: { from: string; to: string; amount: number }) =>
      balanceApi.createSettlement(groupId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.settlements(groupId) });
      toast.success('Settled up');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Failed to settle up';
      toast.error(msg);
    },
  });
}

export function useRemoveMember(groupId: string) {
  const qc = useQueryClient();
  const toast = useToastStore();
  return useMutation({
    mutationFn: (userId: string) => groupApi.removeMember(groupId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      toast.success('Member removed');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Failed to remove member';
      toast.error(msg);
    },
  });
}

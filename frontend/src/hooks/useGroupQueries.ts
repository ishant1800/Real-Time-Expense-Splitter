import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi, expenseApi, balanceApi } from '@/services/groupApi';
import type { CreateExpensePayload } from '@/services/groupApi';

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
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => expenseApi.createExpense(payload),
    onSuccess: () => {
      // Invalidate expenses + balances so both sections refresh
      qc.invalidateQueries({ queryKey: groupKeys.expenses(groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
    },
  });
}

export function useDeleteExpense(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => expenseApi.deleteExpense(expenseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.expenses(groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
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
  return useMutation({
    mutationFn: (payload: { from: string; to: string; amount: number }) =>
      balanceApi.createSettlement(groupId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.settlements(groupId) });
    },
  });
}

export function useRemoveMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => groupApi.removeMember(groupId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
}

import api from './api';
import type {
  Group,
  Expense,
  Settlement,
  NetBalance,
  SimplifiedDebt,
} from '@/types';

// ─── Request / Response shapes ───────────────────────────────────────────────

export interface CreateExpensePayload {
  groupId: string;
  paidBy: string;
  amount: number;
  description: string;
  category: string;
  splitType: 'equal' | 'exact' | 'percentage' | 'shares';
  splits?: { userId: string; amount?: number; percentage?: number; shares?: number }[];
}

export interface UpdateExpensePayload extends Partial<CreateExpensePayload> {}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Group API ────────────────────────────────────────────────────────────────

export const groupApi = {
  /** GET /groups/:id */
  getGroup: async (groupId: string): Promise<Group> => {
    const res = await api.get<ApiResponse<Group>>(`/groups/${groupId}`);
    return res.data.data;
  },

  /** GET /groups — list user's groups */
  listGroups: async (): Promise<Group[]> => {
    const res = await api.get<ApiResponse<Group[]>>('/groups');
    return res.data.data;
  },

  /** POST /groups */
  createGroup: async (name: string): Promise<Group> => {
    const res = await api.post<ApiResponse<Group>>('/groups', { name });
    return res.data.data;
  },

  /** PATCH /groups/:id/rename */
  renameGroup: async (groupId: string, name: string): Promise<Group> => {
    const res = await api.patch<ApiResponse<Group>>(`/groups/${groupId}/rename`, { name });
    return res.data.data;
  },

  /** DELETE /groups/:id */
  deleteGroup: async (groupId: string): Promise<void> => {
    await api.delete(`/groups/${groupId}`);
  },

  /** POST /groups/join */
  joinGroup: async (inviteCode: string): Promise<Group> => {
    const res = await api.post<ApiResponse<Group>>('/groups/join', { inviteCode });
    return res.data.data;
  },

  /** DELETE /groups/:id/members/:userId */
  removeMember: async (groupId: string, userId: string): Promise<void> => {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  },
};

// ─── Expense API ──────────────────────────────────────────────────────────────

export const expenseApi = {
  /** GET /expenses?groupId=... */
  listExpenses: async (groupId: string): Promise<Expense[]> => {
    const res = await api.get<ApiResponse<Expense[]>>(`/expenses?groupId=${groupId}`);
    return res.data.data;
  },

  /** POST /expenses */
  createExpense: async (payload: CreateExpensePayload): Promise<Expense> => {
    const res = await api.post<ApiResponse<Expense>>('/expenses', payload);
    return res.data.data;
  },

  /** PATCH /expenses/:id */
  updateExpense: async (expenseId: string, payload: UpdateExpensePayload): Promise<Expense> => {
    const res = await api.patch<ApiResponse<Expense>>(`/expenses/${expenseId}`, payload);
    return res.data.data;
  },

  /** DELETE /expenses/:id */
  deleteExpense: async (expenseId: string): Promise<void> => {
    await api.delete(`/expenses/${expenseId}`);
  },
};

// ─── Balance API ──────────────────────────────────────────────────────────────

export const balanceApi = {
  /** GET /groups/:id/balances */
  getBalances: async (groupId: string): Promise<NetBalance[]> => {
    const res = await api.get<ApiResponse<NetBalance[]>>(`/groups/${groupId}/balances`);
    return res.data.data;
  },

  /** GET /groups/:id/settlements */
  listSettlements: async (groupId: string): Promise<Settlement[]> => {
    const res = await api.get<ApiResponse<Settlement[]>>(`/groups/${groupId}/settlements`);
    return res.data.data;
  },

  /** POST /groups/:id/settlements */
  createSettlement: async (
    groupId: string,
    payload: { from: string; to: string; amount: number },
  ): Promise<Settlement> => {
    const res = await api.post<ApiResponse<Settlement>>(
      `/groups/${groupId}/settlements`,
      payload,
    );
    return res.data.data;
  },

  /** GET /groups/:id/simplify */
  getSimplifiedDebts: async (groupId: string): Promise<SimplifiedDebt[]> => {
    const res = await api.get<ApiResponse<SimplifiedDebt[]>>(`/groups/${groupId}/simplify`);
    return res.data.data;
  },
};

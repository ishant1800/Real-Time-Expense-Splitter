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
  status: 'success' | 'error';
  data: T;
  message?: string;
}

// ─── Group API ────────────────────────────────────────────────────────────────

export const groupApi = {
  /** GET /groups/:id */
  getGroup: async (groupId: string): Promise<Group> => {
    const res = await api.get<ApiResponse<{ group: Group }>>(`/groups/${groupId}`);
    return res.data.data.group;
  },

  /** GET /groups — list user's groups */
  listGroups: async (): Promise<Group[]> => {
    const res = await api.get<ApiResponse<{ groups: Group[] }>>('/groups');
    return res.data.data.groups;
  },

  /** POST /groups */
  createGroup: async (name: string): Promise<Group> => {
    const res = await api.post<ApiResponse<{ group: Group }>>('/groups', { name });
    return res.data.data.group;
  },

  /** PATCH /groups/:id */
  renameGroup: async (groupId: string, name: string): Promise<Group> => {
    const res = await api.patch<ApiResponse<{ group: Group }>>(`/groups/${groupId}`, { name });
    return res.data.data.group;
  },

  /** DELETE /groups/:id */
  deleteGroup: async (groupId: string): Promise<void> => {
    await api.delete(`/groups/${groupId}`);
  },

  /** POST /groups/join */
  joinGroup: async (inviteCode: string): Promise<Group> => {
    const res = await api.post<ApiResponse<{ group: Group }>>('/groups/join', { inviteCode });
    return res.data.data.group;
  },

  /** DELETE /groups/:id/members/:userId */
  removeMember: async (groupId: string, userId: string): Promise<void> => {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  },
};

// ─── Expense API ──────────────────────────────────────────────────────────────

export const expenseApi = {
  /** GET /expenses/group/:groupId */
  listExpenses: async (groupId: string): Promise<Expense[]> => {
    const res = await api.get<ApiResponse<{ expenses: Expense[] }>>(`/expenses/group/${groupId}`);
    return res.data.data.expenses;
  },

  /** POST /expenses */
  createExpense: async (payload: CreateExpensePayload): Promise<Expense> => {
    const res = await api.post<ApiResponse<{ expense: Expense }>>('/expenses', payload);
    return res.data.data.expense;
  },

  /** PUT /expenses/:id */
  updateExpense: async (expenseId: string, payload: UpdateExpensePayload): Promise<Expense> => {
    const res = await api.put<ApiResponse<{ expense: Expense }>>(`/expenses/${expenseId}`, payload);
    return res.data.data.expense;
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
    const res = await api.get<ApiResponse<{ balances: any[] }>>(`/groups/${groupId}/balances`);
    return res.data.data.balances.map((b) => ({
      userId: b.userId,
      name: b.user?.name || '',
      avatarUrl: b.user?.avatar,
      balance: b.netBalance,
    }));
  },

  /** GET /groups/:id/settlements */
  listSettlements: async (groupId: string): Promise<Settlement[]> => {
    const res = await api.get<ApiResponse<{ settlements: Settlement[] }>>(`/groups/${groupId}/settlements`);
    return res.data.data.settlements;
  },

  /** POST /groups/:id/settlements */
  createSettlement: async (
    groupId: string,
    payload: { from: string; to: string; amount: number },
  ): Promise<Settlement> => {
    const res = await api.post<ApiResponse<{ settlement: Settlement; balances: NetBalance[] }>>(
      `/groups/${groupId}/settlements`,
      payload,
    );
    return res.data.data.settlement;
  },

  /** GET /groups/:id/settlement-path */
  getSimplifiedDebts: async (groupId: string): Promise<SimplifiedDebt[]> => {
    const res = await api.get<ApiResponse<{ transactions: SimplifiedDebt[] }>>(
      `/groups/${groupId}/settlement-path`,
    );
    return res.data.data.transactions;
  },
};

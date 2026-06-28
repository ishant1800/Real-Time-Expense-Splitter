import { BalanceCalculatorService } from './balanceCalculator.service';
import { DebtSimplifierService, SimplifiedTransaction } from './debtSimplifier.service';
import { SettlementRepository } from '../repositories/settlement.repository';
import { GroupRepository } from '../repositories/group.repository';
import { AppError } from '../utils/AppError';
import { emitToGroup } from '../sockets';

export class GroupSettlementService {
  private balanceCalculator: BalanceCalculatorService;
  private debtSimplifier: DebtSimplifierService;
  private settlementRepo: SettlementRepository;
  private groupRepo: GroupRepository;

  constructor() {
    this.balanceCalculator = new BalanceCalculatorService();
    this.debtSimplifier = new DebtSimplifierService();
    this.settlementRepo = new SettlementRepository();
    this.groupRepo = new GroupRepository();
  }

  /**
   * Calculate recommended simplified transactions to settle all debts in a group.
   */
  async getGroupSettlementPath(groupId: string, userId: string): Promise<SimplifiedTransaction[]> {
    // 1. Fetch group net balances
    const netBalances = await this.balanceCalculator.calculateNetBalances(groupId, userId);

    // 2. Map balances to debt simplifier format
    const simplificationInput = netBalances.map((b) => ({
      userId: b.userId,
      name: b.user.name,
      netBalance: b.netBalance,
    }));

    // 3. Simplify debts
    return this.debtSimplifier.simplifyDebts(simplificationInput);
  }

  /**
   * Record a settlement transaction between two users.
   */
  async createSettlement(groupId: string, from: string, to: string, amount: number) {
    const group = await this.groupRepo.findById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    // Verify both debtor (from) and creditor (to) are members of the group
    const isFromMember = group.members.some((m) => m.userId._id.toString() === from);
    const isToMember = group.members.some((m) => m.userId._id.toString() === to);

    if (!isFromMember || !isToMember) {
      throw new AppError('Both settlement sender and receiver must be members of the group', 400);
    }

    if (from === to) {
      throw new AppError('Cannot record a settlement to yourself', 400);
    }

    // Create the settlement record
    const settlement = await this.settlementRepo.create(groupId, from, to, amount);

    // Calculate updated balances
    const balances = await this.balanceCalculator.calculateNetBalances(groupId, from);

    // Emit real-time updates to the group room
    emitToGroup(groupId, 'settlement-completed', settlement);
    emitToGroup(groupId, 'balance-updated', balances);

    return { settlement, balances };
  }
}

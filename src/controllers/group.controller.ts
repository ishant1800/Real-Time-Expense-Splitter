import { Request, Response } from 'express';
import { GroupService } from '../services/group.service';
import { BalanceCalculatorService } from '../services/balanceCalculator.service';
import { GroupSettlementService } from '../services/groupSettlement.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

const groupService = new GroupService();
const balanceCalculatorService = new BalanceCalculatorService();
const groupSettlementService = new GroupSettlementService();

/**
 * POST /api/groups
 * Create a new group.
 */
export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const ownerId = req.user?.userId;
  if (!ownerId) {
    throw new AppError('User not authenticated', 401);
  }

  const group = await groupService.createGroup(name, ownerId);

  ApiResponse.success(res, 201, 'Group created successfully', { group });
});

/**
 * POST /api/groups/join
 * Join a group via invite code.
 */
export const joinGroup = asyncHandler(async (req: Request, res: Response) => {
  const { inviteCode } = req.body;
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const group = await groupService.joinGroup(inviteCode, userId);

  ApiResponse.success(res, 200, 'Successfully joined group', { group });
});

/**
 * GET /api/groups
 * List all groups a user belongs to.
 */
export const listUserGroups = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const groups = await groupService.listUserGroups(userId);

  ApiResponse.success(res, 200, 'User groups retrieved successfully', { groups });
});

/**
 * GET /api/groups/:groupId
 * Retrieve a group by ID. Requester must be a member.
 */
export const getGroupById = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const group = await groupService.getGroupById(groupId as string, userId);

  ApiResponse.success(res, 200, 'Group retrieved successfully', { group });
});

/**
 * PATCH /api/groups/:groupId
 * Rename a group. Only owners can do this.
 */
export const renameGroup = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { name } = req.body;
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const group = await groupService.renameGroup(groupId as string, userId, name as string);

  ApiResponse.success(res, 200, 'Group renamed successfully', { group });
});

/**
 * DELETE /api/groups/:groupId
 * Delete a group. Only owners can do this.
 */
export const deleteGroup = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  await groupService.deleteGroup(groupId as string, userId);

  ApiResponse.success(res, 200, 'Group deleted successfully');
});

/**
 * DELETE /api/groups/:groupId/members/:memberId
 * Remove a member from a group. Only owners can do this.
 */
export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const { groupId, memberId } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const group = await groupService.removeMember(groupId as string, userId, memberId as string);

  ApiResponse.success(res, 200, 'Member removed successfully', { group });
});

/**
 * GET /api/groups/:groupId/balances
 * Retrieve balances of all members in a group.
 */
export const getGroupBalances = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const balances = await balanceCalculatorService.calculateNetBalances(groupId as string, userId);

  ApiResponse.success(res, 200, 'Group balances calculated successfully', { balances });
});

/**
 * GET /api/groups/:groupId/settlement-path
 * Retrieve recommended simplified transactions to settle all debts in a group.
 */
export const getGroupSettlementPath = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const transactions = await groupSettlementService.getGroupSettlementPath(groupId as string, userId);

  ApiResponse.success(res, 200, 'Debt simplification settlement path calculated successfully', { transactions });
});

/**
 * GET /api/groups/:groupId/settlements
 * Retrieve the list of recorded settlements in a group.
 */
export const getGroupSettlements = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const settlements = await groupSettlementService.getGroupSettlements(groupId as string, userId);

  ApiResponse.success(res, 200, 'Group settlements retrieved successfully', { settlements });
});

/**
 * POST /api/groups/:groupId/settlements
 * Record a settlement transaction.
 */
export const createSettlement = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { to, amount } = req.body;
  const from = req.user?.userId;
  if (!from) {
    throw new AppError('User not authenticated', 401);
  }

  const result = await groupSettlementService.createSettlement(
    groupId as string,
    from,
    to as string,
    amount as number
  );

  ApiResponse.success(res, 201, 'Settlement recorded successfully', result);
});

import crypto from 'crypto';
import { GroupRepository } from '../repositories/group.repository';
import { AppError } from '../utils/AppError';
import { IGroupDocument } from '../models/group.model';

export class GroupService {
  private groupRepo: GroupRepository;

  constructor() {
    this.groupRepo = new GroupRepository();
  }

  /**
   * Create a new group.
   */
  async createGroup(name: string, ownerId: string): Promise<IGroupDocument> {
    // Generate a unique invite code
    let inviteCode = '';
    let codeExists = true;

    while (codeExists) {
      inviteCode = this.generateInviteCode();
      const existingGroup = await this.groupRepo.findByInviteCode(inviteCode);
      if (!existingGroup) {
        codeExists = false;
      }
    }

    return this.groupRepo.create(name, ownerId, inviteCode);
  }

  /**
   * Join a group via invite code.
   */
  async joinGroup(inviteCode: string, userId: string): Promise<IGroupDocument> {
    const group = await this.groupRepo.findByInviteCode(inviteCode.toUpperCase());
    if (!group) {
      throw new AppError('Invalid invite code or group does not exist', 404);
    }

    // Check if user is already a member
    const isMember = group.members.some(
      (m) => m.userId.toString() === userId
    );
    if (isMember) {
      throw new AppError('You are already a member of this group', 400);
    }

    const updatedGroup = await this.groupRepo.addMember(group._id.toString(), userId, 'member');
    if (!updatedGroup) {
      throw new AppError('Failed to join group', 500);
    }

    return updatedGroup;
  }

  /**
   * Rename a group (Owners only).
   */
  async renameGroup(groupId: string, userId: string, newName: string): Promise<IGroupDocument> {
    const group = await this.checkOwnerPrivilege(groupId, userId);

    const updatedGroup = await this.groupRepo.updateName(group._id.toString(), newName);
    if (!updatedGroup) {
      throw new AppError('Failed to rename group', 500);
    }

    return updatedGroup;
  }

  /**
   * Delete a group (Owners only).
   */
  async deleteGroup(groupId: string, userId: string): Promise<void> {
    await this.checkOwnerPrivilege(groupId, userId);
    await this.groupRepo.delete(groupId);
  }

  /**
   * Remove a member from a group (Owners only).
   */
  async removeMember(
    groupId: string,
    userId: string,
    memberIdToRemove: string
  ): Promise<IGroupDocument> {
    const group = await this.checkOwnerPrivilege(groupId, userId);

    // Verify member exists in the group
    const member = group.members.find(
      (m) => m.userId._id.toString() === memberIdToRemove
    );
    if (!member) {
      throw new AppError('Member not found in group', 404);
    }

    // Owners cannot remove themselves
    if (memberIdToRemove === userId) {
      throw new AppError('Group owners cannot remove themselves. You must delete the group instead.', 400);
    }

    // Cannot remove another owner if they exist
    if (member.role === 'owner') {
      throw new AppError('Cannot remove a group owner', 400);
    }

    const updatedGroup = await this.groupRepo.removeMember(groupId, memberIdToRemove);
    if (!updatedGroup) {
      throw new AppError('Failed to remove member', 500);
    }

    return updatedGroup;
  }

  /**
   * List all groups a user belongs to.
   */
  async listUserGroups(userId: string): Promise<IGroupDocument[]> {
    return this.groupRepo.listByUserId(userId);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Generates an 8-character uppercase alphanumeric code.
   */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(crypto.randomInt(chars.length));
    }
    return code;
  }

  /**
   * Helper that retrieves a group and asserts that the user is the owner.
   */
  private async checkOwnerPrivilege(groupId: string, userId: string): Promise<IGroupDocument> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const userMembership = group.members.find(
      (m) => m.userId._id.toString() === userId
    );

    if (!userMembership || userMembership.role !== 'owner') {
      throw new AppError('Only the group owner has permission to perform this action', 403);
    }

    return group;
  }
}

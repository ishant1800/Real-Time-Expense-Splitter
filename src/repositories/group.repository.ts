import mongoose from 'mongoose';
import Group, { IGroupDocument } from '../models/group.model';

export class GroupRepository {
  /**
   * Create a new group with the creator set as owner.
   */
  async create(name: string, ownerId: string, inviteCode: string): Promise<IGroupDocument> {
    const group = new Group({
      name,
      inviteCode,
      members: [
        {
          userId: new mongoose.Types.ObjectId(ownerId),
          role: 'owner',
        },
      ],
    });
    return group.save();
  }

  /**
   * Find a group by ID, populating member user details.
   */
  async findById(groupId: string): Promise<IGroupDocument | null> {
    return Group.findById(groupId).populate('members.userId', 'name email avatar');
  }

  /**
   * Find a group by its invite code.
   */
  async findByInviteCode(inviteCode: string): Promise<IGroupDocument | null> {
    return Group.findOne({ inviteCode });
  }

  /**
   * List all groups the given user belongs to.
   */
  async listByUserId(userId: string): Promise<IGroupDocument[]> {
    return Group.find({ 'members.userId': new mongoose.Types.ObjectId(userId) })
      .populate('members.userId', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  /**
   * Update the group's name.
   */
  async updateName(groupId: string, name: string): Promise<IGroupDocument | null> {
    return Group.findByIdAndUpdate(
      groupId,
      { $set: { name } },
      { returnDocument: 'after' }
    ).populate('members.userId', 'name email avatar');
  }

  /**
   * Add a member to a group.
   */
  async addMember(
    groupId: string,
    userId: string,
    role: 'owner' | 'member' = 'member'
  ): Promise<IGroupDocument | null> {
    return Group.findByIdAndUpdate(
      groupId,
      {
        $push: {
          members: {
            userId: new mongoose.Types.ObjectId(userId),
            role,
          },
        },
      },
      { returnDocument: 'after' }
    ).populate('members.userId', 'name email avatar');
  }

  /**
   * Remove a member from a group.
   */
  async removeMember(groupId: string, userId: string): Promise<IGroupDocument | null> {
    return Group.findByIdAndUpdate(
      groupId,
      {
        $pull: {
          members: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
      },
      { returnDocument: 'after' }
    ).populate('members.userId', 'name email avatar');
  }

  /**
   * Delete a group.
   */
  async delete(groupId: string): Promise<void> {
    await Group.findByIdAndDelete(groupId);
  }
}

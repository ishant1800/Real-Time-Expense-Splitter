import mongoose from 'mongoose';
import Settlement, { ISettlementDocument } from '../models/settlement.model';

export class SettlementRepository {
  /**
   * Create a new settlement record.
   */
  async create(
    groupId: string,
    from: string,
    to: string,
    amount: number
  ): Promise<ISettlementDocument> {
    const settlement = new Settlement({
      groupId: new mongoose.Types.ObjectId(groupId),
      from: new mongoose.Types.ObjectId(from),
      to: new mongoose.Types.ObjectId(to),
      amount,
    });
    return settlement.save();
  }

  /**
   * Find all settlements in a group.
   */
  async findByGroupId(groupId: string): Promise<ISettlementDocument[]> {
    return Settlement.find({ groupId })
      .populate('from', 'name email avatar')
      .populate('to', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  /**
   * Delete a settlement record.
   */
  async delete(settlementId: string): Promise<void> {
    await Settlement.findByIdAndDelete(settlementId);
  }
}

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettlement {
  groupId: mongoose.Types.ObjectId;
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISettlementDocument extends ISettlement, Document {}

const settlementSchema = new Schema<ISettlementDocument>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
  },
  {
    timestamps: true,
  }
);

settlementSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

const Settlement: Model<ISettlementDocument> = mongoose.model<ISettlementDocument>(
  'Settlement',
  settlementSchema
);

export default Settlement;

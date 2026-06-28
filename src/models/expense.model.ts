import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpenseSplit {
  userId: mongoose.Types.ObjectId;
  amount: number;
  percentage?: number;
  share?: number;
}

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';

export interface IExpense {
  groupId: mongoose.Types.ObjectId;
  paidBy: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  category: string;
  receiptUrl?: string;
  splitType: SplitType;
  splits: IExpenseSplit[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IExpenseDocument extends IExpense, Document {}

const expenseSplitSchema = new Schema<IExpenseSplit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
    },
    share: {
      type: Number,
    },
  },
  { _id: false }
);

const expenseSchema = new Schema<IExpenseDocument>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [255, 'Description cannot exceed 255 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
    splitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage', 'shares'],
      required: true,
    },
    splits: {
      type: [expenseSplitSchema],
      required: true,
      validate: [
        {
          validator: (v: IExpenseSplit[]) => v.length > 0,
          message: 'At least one split participant is required',
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

const Expense: Model<IExpenseDocument> = mongoose.model<IExpenseDocument>('Expense', expenseSchema);

export default Expense;

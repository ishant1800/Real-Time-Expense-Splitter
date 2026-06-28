import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGroupMember {
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'member';
}

export interface IGroup {
  name: string;
  inviteCode: string;
  members: IGroupMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupDocument extends IGroup, Document {}

const groupMemberSchema = new Schema<IGroupMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member',
      required: true,
    },
  },
  { _id: false }
);

const groupSchema = new Schema<IGroupDocument>(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    members: {
      type: [groupMemberSchema],
      required: true,
      validate: [
        {
          validator: (v: IGroupMember[]) => v.length > 0,
          message: 'A group must have at least one member',
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

groupSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

const Group: Model<IGroupDocument> = mongoose.model<IGroupDocument>('Group', groupSchema);

export default Group;

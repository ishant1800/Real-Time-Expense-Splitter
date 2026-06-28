import mongoose, { Schema, Document, Model } from 'mongoose';

// -------------------------------------------------------------------
// Interface
// -------------------------------------------------------------------
export interface IUser {
  name: string;
  email: string;
  passwordHash?: string;
  provider: 'local' | 'google';
  googleId?: string;
  avatar?: string;
  isEmailVerified: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}

// -------------------------------------------------------------------
// Schema
// -------------------------------------------------------------------
const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      select: false, // never returned in queries by default
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      sparse: true,
    },
    avatar: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // auto-manages createdAt & updatedAt
  }
);

// -------------------------------------------------------------------
// Indexes
// -------------------------------------------------------------------
userSchema.index({ provider: 1 });

// -------------------------------------------------------------------
// JSON Transform — strip passwordHash from every serialized response
// -------------------------------------------------------------------
userSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

// -------------------------------------------------------------------
// Export
// -------------------------------------------------------------------
const User: Model<IUserDocument> = mongoose.model<IUserDocument>('User', userSchema);

export default User;

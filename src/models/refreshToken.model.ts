import mongoose, { Schema, Document, Model } from 'mongoose';

// -------------------------------------------------------------------
// Interface
// -------------------------------------------------------------------
export interface IRefreshToken {
  token: string; // hashed
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

export interface IRefreshTokenDocument extends IRefreshToken, Document {}

// -------------------------------------------------------------------
// Schema
// -------------------------------------------------------------------
const refreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index — MongoDB automatically deletes expired documents
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// -------------------------------------------------------------------
// Export
// -------------------------------------------------------------------
const RefreshToken: Model<IRefreshTokenDocument> = mongoose.model<IRefreshTokenDocument>(
  'RefreshToken',
  refreshTokenSchema
);

export default RefreshToken;

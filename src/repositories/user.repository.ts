import User, { IUserDocument } from '../models/user.model';

export class UserRepository {
  /**
   * Find a user by email, explicitly including the passwordHash field.
   */
  async findByEmail(email: string): Promise<IUserDocument | null> {
    return User.findOne({ email }).select('+passwordHash');
  }

  /**
   * Find a user by ID (without passwordHash).
   */
  async findById(id: string): Promise<IUserDocument | null> {
    return User.findById(id);
  }

  /**
   * Find a user by Google ID.
   */
  async findByGoogleId(googleId: string): Promise<IUserDocument | null> {
    return User.findOne({ googleId });
  }

  /**
   * Create a new user.
   */
  async create(data: {
    name: string;
    email: string;
    passwordHash?: string;
    provider?: 'local' | 'google';
    googleId?: string;
    avatar?: string;
    isEmailVerified?: boolean;
  }): Promise<IUserDocument> {
    const user = new User(data);
    return user.save();
  }

  /**
   * Link an existing account to Google.
   */
  async linkGoogleAccount(
    userId: string,
    googleId: string,
    avatar?: string
  ): Promise<IUserDocument | null> {
    const updateData: Record<string, any> = { googleId, isEmailVerified: true };
    if (avatar) {
      updateData.avatar = avatar;
    }
    return User.findByIdAndUpdate(userId, { $set: updateData }, { returnDocument: 'after' });
  }

  /**
   * Find a user by password reset token that has not expired yet.
   */
  async findByResetToken(hashedToken: string): Promise<IUserDocument | null> {
    return User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');
  }
}

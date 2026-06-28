import RefreshToken, { IRefreshTokenDocument } from '../models/refreshToken.model';

export class RefreshTokenRepository {
  /**
   * Store a new hashed refresh token.
   */
  async create(
    userId: string,
    hashedToken: string,
    expiresAt: Date
  ): Promise<IRefreshTokenDocument> {
    const token = new RefreshToken({
      token: hashedToken,
      userId,
      expiresAt,
    });
    return token.save();
  }

  /**
   * Find a refresh token document by its hashed value.
   */
  async findByToken(hashedToken: string): Promise<IRefreshTokenDocument | null> {
    return RefreshToken.findOne({ token: hashedToken });
  }

  /**
   * Delete all refresh tokens for a specific user (e.g. on password change).
   */
  async deleteByUserId(userId: string): Promise<void> {
    await RefreshToken.deleteMany({ userId });
  }

  /**
   * Delete a single refresh token by its hashed value.
   */
  async deleteByToken(hashedToken: string): Promise<void> {
    await RefreshToken.deleteOne({ token: hashedToken });
  }
}

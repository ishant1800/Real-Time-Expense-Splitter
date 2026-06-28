import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refreshToken.repository';
import { EmailService } from './email.service';
import { env } from '../config/env';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/Logger';

const SALT_ROUNDS = 12;
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// Parse duration strings like "7d", "15m", "1h" into milliseconds
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default:  return 7 * 24 * 60 * 60 * 1000;
  }
}

export class AuthService {
  private userRepo: UserRepository;
  private refreshTokenRepo: RefreshTokenRepository;
  private emailService: EmailService;

  constructor() {
    this.userRepo = new UserRepository();
    this.refreshTokenRepo = new RefreshTokenRepository();
    this.emailService = new EmailService();
  }

  /**
   * Register a new user.
   */
  async register(name: string, email: string, password: string) {
    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new AppError('A user with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await this.userRepo.create({
      name,
      email,
      passwordHash,
      provider: 'local',
    });

    // Generate tokens
    const userId = user._id.toString();
    const payload: TokenPayload = { userId, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store hashed refresh token
    await this.storeRefreshToken(userId, refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login an existing user.
   */
  async login(email: string, password: string) {
    // Find user with password field
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    if (!user.passwordHash) {
      throw new AppError('This account uses social login. Please sign in with Google.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const userId = user._id.toString();
    const payload: TokenPayload = { userId, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store hashed refresh token
    await this.storeRefreshToken(userId, refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh token rotation — validate old token, delete it, issue new pair.
   */
  async refreshTokens(oldRefreshToken: string) {
    // Verify the JWT signature and expiry
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Check the hashed token exists in the database
    const hashedToken = this.hashToken(oldRefreshToken);
    const storedToken = await this.refreshTokenRepo.findByToken(hashedToken);
    if (!storedToken) {
      // Possible token reuse attack — revoke all tokens for this user
      await this.refreshTokenRepo.deleteByUserId(payload.userId);
      throw new AppError('Refresh token has been revoked. Please login again.', 401);
    }

    // Delete old token (rotation)
    await this.refreshTokenRepo.deleteByToken(hashedToken);

    // Verify the user still exists
    const user = await this.userRepo.findById(payload.userId);
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    // Issue new token pair
    const userId = user._id.toString();
    const newPayload: TokenPayload = { userId, email: user.email };
    const accessToken = generateAccessToken(newPayload);
    const refreshToken = generateRefreshToken(newPayload);

    // Store new hashed refresh token
    await this.storeRefreshToken(userId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logout — delete the refresh token from the database.
   */
  async logout(refreshToken: string): Promise<void> {
    const hashedToken = this.hashToken(refreshToken);
    await this.refreshTokenRepo.deleteByToken(hashedToken);
  }

  /**
   * Retrieve the user profile by ID.
   */
  async getUserProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  /**
   * Login or register via Google ID token.
   */
  async googleLogin(idToken: string) {
    let googleId: string;
    let email: string;
    let name: string;
    let picture: string | undefined;

    if (env.MOCK_GOOGLE_AUTH && idToken.startsWith('mock_token_')) {
      const parts = idToken.split('_');
      googleId = parts[2] || 'mock_google_id';
      email = parts[3] || 'mock@example.com';
      name = parts[4] ? decodeURIComponent(parts[4]) : 'Mock User';
      picture = parts[5] ? decodeURIComponent(parts[5]) : undefined;
    } else {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.sub || !payload.email || !payload.name) {
          throw new AppError('Invalid Google ID token payload', 400);
        }
        googleId = payload.sub;
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
      } catch (err: any) {
        if (err instanceof AppError) throw err;
        throw new AppError(`Google authentication failed: ${err.message}`, 401);
      }
    }

    // 1. Check if user already exists with this googleId
    let user = await this.userRepo.findByGoogleId(googleId);

    if (user) {
      const userId = user._id.toString();
      const tokenPayload: TokenPayload = { userId, email: user.email };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      await this.storeRefreshToken(userId, refreshToken);

      return { user, accessToken, refreshToken };
    }

    // 2. Check if a user with this email already exists (registered via local)
    user = await this.userRepo.findByEmail(email);

    if (user) {
      // Link the Google account to this existing email
      const updatedUser = await this.userRepo.linkGoogleAccount(
        user._id.toString(),
        googleId,
        picture
      );
      if (!updatedUser) {
        throw new AppError('Failed to link Google account', 500);
      }
      user = updatedUser;
    } else {
      // 3. User does not exist, create a new one
      user = await this.userRepo.create({
        name,
        email,
        googleId,
        provider: 'google',
        avatar: picture,
        isEmailVerified: true,
      });
    }

    const userId = user._id.toString();
    const tokenPayload: TokenPayload = { userId, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await this.storeRefreshToken(userId, refreshToken);

    return { user, accessToken, refreshToken };
  }

  /**
   * Request password reset token.
   * Employs generic response logic to prevent email enumeration.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      logger.warn(`Forgot password request for non-existent email: ${email}`);
      return;
    }

    if (user.provider !== 'local') {
      logger.warn(`Forgot password request for social login account: ${email}`);
      return;
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = this.hashToken(rawResetToken);
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = tokenExpiry;
    await user.save();

    await this.emailService.sendPasswordResetEmail(email, rawResetToken);
  }

  /**
   * Reset password using token.
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const hashedToken = this.hashToken(rawToken);

    const user = await this.userRepo.findByResetToken(hashedToken);
    if (!user) {
      throw new AppError('Invalid or expired password reset token', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    user.passwordHash = passwordHash;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await this.refreshTokenRepo.deleteByUserId(user._id.toString());
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Hash a raw refresh token using SHA-256 before storing.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Store a hashed refresh token in the database.
   */
  private async storeRefreshToken(userId: string, rawToken: string): Promise<void> {
    const hashedToken = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES_IN));
    await this.refreshTokenRepo.create(userId, hashedToken, expiresAt);
  }
}

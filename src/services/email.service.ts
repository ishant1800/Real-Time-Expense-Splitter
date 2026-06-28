import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/Logger';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Initialize transporter only if SMTP_HOST is defined
    if (env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER && env.SMTP_PASS ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        } : undefined,
      });
    }
  }

  /**
   * Send a password reset email.
   * Logs to console in development as a fallback if no SMTP transporter is set up.
   */
  async sendPasswordResetEmail(toEmail: string, resetToken: string): Promise<void> {
    const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request — Expense Splitter';

    const textContent = `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n`
      + `Please click on the following link, or paste this into your browser to complete the process within 15 minutes:\n\n`
      + `${resetUrl}\n\n`
      + `If you did not request this, please ignore this email and your password will remain unchanged.\n`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333333; text-align: center;">Password Reset Request</h2>
        <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account on <strong>Expense Splitter</strong>.</p>
        <p>Please click the button below to reset your password. This link is valid for <strong>15 minutes</strong>:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #555555;"><a href="${resetUrl}">${resetUrl}</a></p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #888888; text-align: center;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
      </div>
    `;

    if (!this.transporter) {
      logger.info(`[EMAIL SEND MOCK] Target: ${toEmail} | Reset Link: ${resetUrl}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      logger.info(`Password reset email successfully sent to ${toEmail}`);
    } catch (error) {
      logger.error('Failed to send email via SMTP', error);
      if (env.NODE_ENV === 'development') {
        logger.warn(`Email sending failed fallback link: ${resetUrl}`);
      } else {
        throw error;
      }
    }
  }
}

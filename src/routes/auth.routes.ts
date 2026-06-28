import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  me,
  googleLogin,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateGoogleLogin,
  validateForgotPassword,
  validateResetPassword,
} from '../validators/auth.validator';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', validateRefreshToken, refresh);
router.post('/logout', validateRefreshToken, logout);
router.post('/google', validateGoogleLogin, googleLogin);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/me', authenticate, me);

export default router;

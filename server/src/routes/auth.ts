import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateLogin, validatePasswordChange } from '../middleware/validation';
import { logActivity } from '../middleware/logging';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for authentication routes
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const passwordChangeRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password changes per hour
  message: 'Too many password change attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes
router.post('/login', 
  authRateLimit,
  validateLogin,
  logActivity('user_login'),
  authController.login
);

router.post('/refresh-token', 
  authRateLimit,
  logActivity('token_refresh'),
  authController.refreshToken
);

// Protected routes
router.post('/logout',
  authenticateToken,
  logActivity('user_logout'),
  authController.logout
);

router.get('/profile',
  authenticateToken,
  authController.getProfile
);

router.put('/profile',
  authenticateToken,
  logActivity('profile_update'),
  authController.updateProfile
);

router.post('/change-password',
  authenticateToken,
  passwordChangeRateLimit,
  validatePasswordChange,
  logActivity('password_change'),
  authController.changePassword
);

router.get('/verify-token',
  authenticateToken,
  authController.verifyToken
);

export default router;
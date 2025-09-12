import { Request, Response } from 'express';
import { User } from '../models';
import { ApiResponse, TokenHelper } from '../utils/helpers';
import { Validator } from '../utils/validator';
import { Sanitizer } from '../utils/sanitizer';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { error, value } = Validator.validateLogin(req.body);
      
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      const { login, password } = value;

      // Find user by login
      const user = await User.findOne({
        where: { login: login.toLowerCase(), is_active: true }
      });

      if (!user) {
        return ApiResponse.unauthorized(res, 'Invalid credentials');
      }

      // Verify password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return ApiResponse.unauthorized(res, 'Invalid credentials');
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Generate tokens
      const tokens = TokenHelper.generateTokens(user.id);

      // Return user data without password
      const userData = user.toJSON();

      return ApiResponse.success(res, {
        user: userData,
        tokens
      }, 'Login successful');

    } catch (error) {
      console.error('Login error:', error);
      return ApiResponse.error(res, 'Login failed');
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return ApiResponse.unauthorized(res, 'Refresh token required');
      }

      const decoded = TokenHelper.verifyToken(refresh_token);
      
      if (!decoded || decoded.type !== 'refresh') {
        return ApiResponse.unauthorized(res, 'Invalid refresh token');
      }

      // Verify user still exists and is active
      const user = await User.findByPk(decoded.userId);
      if (!user || !user.is_active) {
        return ApiResponse.unauthorized(res, 'Invalid refresh token');
      }

      // Generate new tokens
      const tokens = TokenHelper.generateTokens(user.id);

      return ApiResponse.success(res, { tokens }, 'Token refreshed');

    } catch (error) {
      console.error('Token refresh error:', error);
      return ApiResponse.unauthorized(res, 'Invalid refresh token');
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      // In a more advanced implementation, we could maintain a blacklist of tokens
      // For now, we just return success as JWT tokens are stateless
      return ApiResponse.success(res, null, 'Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      return ApiResponse.error(res, 'Logout failed');
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const user = await User.findByPk(userId, {
        attributes: ['id', 'login', 'full_name', 'email', 'role', 'is_active', 'created_at', 'last_login']
      });

      if (!user) {
        return ApiResponse.notFound(res, 'User not found');
      }

      return ApiResponse.success(res, user, 'Profile retrieved successfully');

    } catch (error) {
      console.error('Get profile error:', error);
      return ApiResponse.error(res, 'Failed to retrieve profile');
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      const allowedFields = ['full_name', 'email'];
      const updateData = Sanitizer.sanitizeObjectKeys(req.body, allowedFields);

      // Validate update data
      const { error, value } = Validator.validateUserUpdate(updateData);
      
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      // Check if email is already taken by another user
      if (value.email) {
        const existingUser = await User.findOne({
          where: { 
            email: value.email,
            id: { [require('sequelize').Op.ne]: userId }
          }
        });

        if (existingUser) {
          return ApiResponse.error(res, 'Email already exists', 409);
        }
      }

      // Update user
      const user = await User.findByPk(userId);
      if (!user) {
        return ApiResponse.notFound(res, 'User not found');
      }

      await user.update(value);

      const updatedUser = await User.findByPk(userId, {
        attributes: ['id', 'login', 'full_name', 'email', 'role', 'is_active', 'created_at', 'last_login']
      });

      return ApiResponse.success(res, updatedUser, 'Profile updated successfully');

    } catch (error) {
      console.error('Update profile error:', error);
      return ApiResponse.error(res, 'Failed to update profile');
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      const { error, value } = Validator.validatePasswordChange(req.body);
      
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      const { current_password, new_password } = value;

      // Get user with password
      const user = await User.scope('withPassword').findByPk(userId);
      if (!user) {
        return ApiResponse.notFound(res, 'User not found');
      }

      // Verify current password
      const isValidPassword = await user.validatePassword(current_password);
      if (!isValidPassword) {
        return ApiResponse.unauthorized(res, 'Current password is incorrect');
      }

      // Update password
      await user.update({ password_hash: new_password });

      return ApiResponse.success(res, null, 'Password changed successfully');

    } catch (error) {
      console.error('Change password error:', error);
      return ApiResponse.error(res, 'Failed to change password');
    }
  }

  async verifyToken(req: AuthenticatedRequest, res: Response) {
    try {
      // If we reach here, the token is valid (middleware verified it)
      return ApiResponse.success(res, {
        user: req.user,
        valid: true
      }, 'Token is valid');

    } catch (error) {
      console.error('Token verification error:', error);
      return ApiResponse.error(res, 'Token verification failed');
    }
  }
}

export default new AuthController();
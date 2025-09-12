import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/app';
import { User } from '../models';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    login: string;
    role: 'employee' | 'coordinator' | 'admin';
    full_name: string;
    email: string;
  };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    // Verify user still exists and is active
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'login', 'role', 'full_name', 'email', 'is_active']
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = {
      id: user.id,
      login: user.login,
      role: user.role,
      full_name: user.full_name,
      email: user.email
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      const user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'login', 'role', 'full_name', 'email', 'is_active']
      });

      if (user && user.is_active) {
        req.user = {
          id: user.id,
          login: user.login,
          role: user.role,
          full_name: user.full_name,
          email: user.email
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};
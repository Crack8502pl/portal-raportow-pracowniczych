import { Request, Response, NextFunction } from 'express';
import { ActivityLog } from '../models';
import { AuthenticatedRequest } from './auth';

export const logActivity = (action: string, resourceType?: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const resourceId = req.params.id ? parseInt(req.params.id) : undefined;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Store original end method to capture response
      const originalEnd = res.end;
      let responseBody = '';

      res.end = function(chunk?: any, encoding?: any) {
        if (chunk) {
          responseBody = chunk;
        }
        originalEnd.call(this, chunk, encoding);
      };

      // Log after response
      res.on('finish', async () => {
        try {
          await ActivityLog.create({
            user_id: userId,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            details: {
              method: req.method,
              url: req.originalUrl,
              status: res.statusCode,
              body: req.method !== 'GET' ? req.body : undefined,
              query: req.query
            },
            ip_address: ipAddress,
            user_agent: userAgent
          });
        } catch (error) {
          console.error('Failed to log activity:', error);
        }
      });

      next();
    } catch (error) {
      console.error('Activity logging middleware error:', error);
      next();
    }
  };
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};
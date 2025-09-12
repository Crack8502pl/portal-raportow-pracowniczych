import { Response } from 'express';
import { Op } from 'sequelize';
import { SystemSettings, ActivityLog, User, Report, Employee } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../utils/helpers';
import { Validator } from '../utils/validator';
import emailService from '../services/emailService';
import fileService from '../services/fileService';

export class AdminController {
  async getSystemSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user!.role;
      
      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      const settings = await SystemSettings.findAll({
        order: [['setting_key', 'asc']]
      });

      // Convert to key-value object for easier frontend handling
      const settingsObject = settings.reduce((acc: any, setting) => {
        acc[setting.setting_key] = {
          value: setting.setting_value,
          description: setting.description,
          updated_at: setting.updated_at,
          updated_by: setting.updated_by
        };
        return acc;
      }, {});

      return ApiResponse.success(res, settingsObject, 'System settings retrieved successfully');

    } catch (error) {
      console.error('Get system settings error:', error);
      return ApiResponse.error(res, 'Failed to retrieve system settings');
    }
  }

  async updateSystemSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      const { error, value } = Validator.validateSystemSettings(req.body);
      
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      // Update settings
      const updatePromises = Object.entries(value).map(async ([key, val]) => {
        const [setting] = await SystemSettings.findOrCreate({
          where: { setting_key: key },
          defaults: {
            setting_key: key,
            setting_value: String(val),
            updated_by: userId
          }
        });

        if (!setting.isNewRecord) {
          await setting.update({
            setting_value: String(val),
            updated_by: userId,
            updated_at: new Date()
          });
        }

        return setting;
      });

      await Promise.all(updatePromises);

      return ApiResponse.success(res, null, 'System settings updated successfully');

    } catch (error) {
      console.error('Update system settings error:', error);
      return ApiResponse.error(res, 'Failed to update system settings');
    }
  }

  async getActivityLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user!.role;
      
      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      const filters = Validator.sanitizeAndValidateFilters(req.query);
      
      const whereConditions: any = {};
      
      if (filters.search) {
        whereConditions[Op.or] = [
          { action: { [Op.iLike]: `%${filters.search}%` } },
          { resource_type: { [Op.iLike]: `%${filters.search}%` } }
        ];
      }

      if (filters.date_from || filters.date_to) {
        whereConditions.created_at = {};
        if (filters.date_from) {
          whereConditions.created_at[Op.gte] = filters.date_from;
        }
        if (filters.date_to) {
          whereConditions.created_at[Op.lte] = filters.date_to;
        }
      }

      const total = await ActivityLog.count({ where: whereConditions });

      const logs = await ActivityLog.findAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['full_name', 'email', 'role']
          }
        ],
        order: [['created_at', 'desc']],
        limit: filters.limit,
        offset: (filters.page - 1) * filters.limit
      });

      const totalPages = Math.ceil(total / filters.limit);

      return ApiResponse.success(res, {
        logs,
        pagination: {
          current_page: filters.page,
          total_pages: totalPages,
          total_records: total,
          records_per_page: filters.limit
        }
      }, 'Activity logs retrieved successfully');

    } catch (error) {
      console.error('Get activity logs error:', error);
      return ApiResponse.error(res, 'Failed to retrieve activity logs');
    }
  }

  async getSystemStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user!.role;
      
      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats = {
        users: {
          total: await User.count(),
          active: await User.count({ where: { is_active: true } }),
          admins: await User.count({ where: { role: 'admin' } }),
          coordinators: await User.count({ where: { role: 'coordinator' } }),
          employees: await User.count({ where: { role: 'employee' } })
        },
        reports: {
          total: await Report.count(),
          this_month: await Report.count({
            where: { created_at: { [Op.gte]: startOfMonth } }
          }),
          this_week: await Report.count({
            where: { created_at: { [Op.gte]: startOfWeek } }
          }),
          draft: await Report.count({ where: { status: 'draft' } }),
          sent: await Report.count({ where: { status: 'sent' } })
        },
        employees: {
          total: await Employee.count(),
          active: await Employee.count({ where: { is_active: true } }),
          inactive: await Employee.count({ where: { is_active: false } })
        },
        activity: {
          total_logs: await ActivityLog.count(),
          logs_this_week: await ActivityLog.count({
            where: { created_at: { [Op.gte]: startOfWeek } }
          }),
          unique_users_this_week: await ActivityLog.count({
            where: { created_at: { [Op.gte]: startOfWeek } },
            distinct: true,
            col: 'user_id'
          })
        }
      };

      // Get most active users this month
      const mostActiveUsers = await ActivityLog.findAll({
        where: { created_at: { [Op.gte]: startOfMonth } },
        attributes: [
          'user_id',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'activity_count']
        ],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['full_name', 'role']
          }
        ],
        group: ['user_id', 'user.id'],
        order: [[require('sequelize').fn('COUNT', require('sequelize').col('ActivityLog.id')), 'DESC']],
        limit: 5
      });

      // Get recent reports by day (last 7 days)
      const recentReportsData = await Report.findAll({
        where: { created_at: { [Op.gte]: startOfWeek } },
        attributes: [
          [require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'date'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: [require('sequelize').fn('DATE', require('sequelize').col('created_at'))],
        order: [[require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'ASC']]
      });

      return ApiResponse.success(res, {
        ...stats,
        most_active_users: mostActiveUsers,
        recent_reports_data: recentReportsData
      }, 'System statistics retrieved successfully');

    } catch (error) {
      console.error('Get system stats error:', error);
      return ApiResponse.error(res, 'Failed to retrieve system statistics');
    }
  }

  async testEmailConnection(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user!.role;
      
      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      const isConnected = await emailService.testConnection();
      
      if (isConnected) {
        return ApiResponse.success(res, { connected: true }, 'Email connection test successful');
      } else {
        return ApiResponse.error(res, 'Email connection test failed', 500);
      }

    } catch (error) {
      console.error('Test email connection error:', error);
      return ApiResponse.error(res, 'Email connection test failed');
    }
  }

  async cleanupOldFiles(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user!.role;
      
      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      const maxAgeMs = parseInt(req.query.max_age_days as string || '30') * 24 * 60 * 60 * 1000;
      
      const deletedCount = await fileService.cleanupOldFiles('./uploads', maxAgeMs);
      const exportDeletedCount = await fileService.cleanupOldFiles('./exports', maxAgeMs);

      return ApiResponse.success(res, {
        deleted_uploads: deletedCount,
        deleted_exports: exportDeletedCount,
        total_deleted: deletedCount + exportDeletedCount
      }, 'File cleanup completed successfully');

    } catch (error) {
      console.error('Cleanup old files error:', error);
      return ApiResponse.error(res, 'File cleanup failed');
    }
  }

  async getDatabaseInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user!.role;
      
      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      // Get database connection info (without sensitive data)
      const { sequelize } = require('../models');
      const queryInterface = sequelize.getQueryInterface();
      
      const dbInfo = {
        dialect: sequelize.getDialect(),
        database_name: sequelize.config.database,
        host: sequelize.config.host,
        port: sequelize.config.port,
        pool: sequelize.config.pool,
        connection_count: sequelize.connectionManager.pool?.size || 'N/A'
      };

      // Test database connection
      try {
        await sequelize.authenticate();
        dbInfo.connection_status = 'Connected';
      } catch (error) {
        dbInfo.connection_status = 'Failed';
      }

      return ApiResponse.success(res, dbInfo, 'Database information retrieved successfully');

    } catch (error) {
      console.error('Get database info error:', error);
      return ApiResponse.error(res, 'Failed to retrieve database information');
    }
  }

  async exportSystemData(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user!.role;
      
      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      const exportType = req.query.type as string || 'users';
      
      let data: any[] = [];
      let filename = '';

      switch (exportType) {
        case 'users':
          data = await User.findAll({
            attributes: ['id', 'login', 'full_name', 'email', 'role', 'is_active', 'created_at', 'last_login']
          });
          filename = 'users_export.json';
          break;

        case 'employees':
          data = await Employee.findAll();
          filename = 'employees_export.json';
          break;

        case 'activity_logs':
          data = await ActivityLog.findAll({
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['full_name', 'email']
              }
            ],
            limit: 1000, // Limit to prevent huge exports
            order: [['created_at', 'desc']]
          });
          filename = 'activity_logs_export.json';
          break;

        case 'system_settings':
          data = await SystemSettings.findAll();
          filename = 'system_settings_export.json';
          break;

        default:
          return ApiResponse.error(res, 'Invalid export type', 400);
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      return res.json({
        export_type: exportType,
        exported_at: new Date().toISOString(),
        record_count: data.length,
        data
      });

    } catch (error) {
      console.error('Export system data error:', error);
      return ApiResponse.error(res, 'Failed to export system data');
    }
  }

  async getSystemHealth(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user!.role;
      
      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      const health = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development'
      };

      // Test database connection
      try {
        const { sequelize } = require('../models');
        await sequelize.authenticate();
        health.database_status = 'healthy';
      } catch (error) {
        health.database_status = 'unhealthy';
      }

      // Test email service
      try {
        const emailStatus = await emailService.testConnection();
        health.email_status = emailStatus ? 'healthy' : 'unhealthy';
      } catch (error) {
        health.email_status = 'unhealthy';
      }

      const overallStatus = health.database_status === 'healthy' && health.email_status === 'healthy' 
        ? 'healthy' : 'degraded';

      return ApiResponse.success(res, {
        status: overallStatus,
        ...health
      }, 'System health check completed');

    } catch (error) {
      console.error('System health check error:', error);
      return ApiResponse.error(res, 'System health check failed');
    }
  }
}

export default new AdminController();
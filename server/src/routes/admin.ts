import { Router } from 'express';
import adminController from '../controllers/adminController';
import { authenticateToken, authorize } from '../middleware/auth';
import { logActivity } from '../middleware/logging';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorize('admin'));

// System settings management
router.get('/settings',
  logActivity('settings_view', 'system'),
  adminController.getSystemSettings
);

router.put('/settings',
  logActivity('settings_update', 'system'),
  adminController.updateSystemSettings
);

// Activity logs
router.get('/activity-logs',
  logActivity('activity_logs_view', 'system'),
  adminController.getActivityLogs
);

// System statistics and monitoring
router.get('/stats',
  logActivity('system_stats_view', 'system'),
  adminController.getSystemStats
);

router.get('/health',
  logActivity('system_health_check', 'system'),
  adminController.getSystemHealth
);

// Database information
router.get('/database-info',
  logActivity('database_info_view', 'system'),
  adminController.getDatabaseInfo
);

// System utilities
router.post('/test-email',
  logActivity('email_test', 'system'),
  adminController.testEmailConnection
);

router.post('/cleanup-files',
  logActivity('file_cleanup', 'system'),
  adminController.cleanupOldFiles
);

// Data export for backup/analysis
router.get('/export/:type',
  logActivity('data_export', 'system'),
  adminController.exportSystemData
);

export default router;
import { Router } from 'express';
import reportController from '../controllers/reportController';
import { authenticateToken, authorize } from '../middleware/auth';
import { validateReportCreation } from '../middleware/validation';
import { uploadMiddleware, handleUploadError } from '../middleware/upload';
import { logActivity } from '../middleware/logging';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get reports (with filtering and pagination)
router.get('/',
  logActivity('report_list', 'report'),
  reportController.getReports
);

// Get report statistics
router.get('/stats',
  logActivity('report_stats', 'report'),
  reportController.getReportStats
);

// Export reports (coordinators and admins only)
router.get('/export',
  authorize('coordinator', 'admin'),
  logActivity('report_export', 'report'),
  reportController.exportReports
);

// Get specific report by ID
router.get('/:id',
  logActivity('report_view', 'report'),
  reportController.getReportById
);

// Create new report
router.post('/',
  uploadMiddleware,
  handleUploadError,
  validateReportCreation,
  logActivity('report_create', 'report'),
  reportController.createReport
);

// Update existing report
router.put('/:id',
  uploadMiddleware,
  handleUploadError,
  logActivity('report_update', 'report'),
  reportController.updateReport
);

// Delete report
router.delete('/:id',
  logActivity('report_delete', 'report'),
  reportController.deleteReport
);

export default router;
import { Router } from 'express';
import userController from '../controllers/userController';
import { authenticateToken, authorize } from '../middleware/auth';
import { validateUserCreation, validateEmployeeCreation } from '../middleware/validation';
import { logActivity } from '../middleware/logging';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// User management routes

// Get all users (coordinators and admins only)
router.get('/',
  authorize('coordinator', 'admin'),
  logActivity('user_list', 'user'),
  userController.getUsers
);

// Get specific user by ID
router.get('/:id',
  logActivity('user_view', 'user'),
  userController.getUserById
);

// Create new user (admins only)
router.post('/',
  authorize('admin'),
  validateUserCreation,
  logActivity('user_create', 'user'),
  userController.createUser
);

// Update user
router.put('/:id',
  logActivity('user_update', 'user'),
  userController.updateUser
);

// Delete user (admins only)
router.delete('/:id',
  authorize('admin'),
  logActivity('user_delete', 'user'),
  userController.deleteUser
);

// Reset user password (admins only)
router.post('/:id/reset-password',
  authorize('admin'),
  logActivity('password_reset', 'user'),
  userController.resetPassword
);

// Employee management routes

// Get all employees
router.get('/employees/list',
  logActivity('employee_list', 'employee'),
  userController.getEmployees
);

// Create new employee (coordinators and admins only)
router.post('/employees',
  authorize('coordinator', 'admin'),
  validateEmployeeCreation,
  logActivity('employee_create', 'employee'),
  userController.createEmployee
);

// Update employee (coordinators and admins only)
router.put('/employees/:id',
  authorize('coordinator', 'admin'),
  logActivity('employee_update', 'employee'),
  userController.updateEmployee
);

// Delete/deactivate employee (admins only)
router.delete('/employees/:id',
  authorize('admin'),
  logActivity('employee_delete', 'employee'),
  userController.deleteEmployee
);

export default router;
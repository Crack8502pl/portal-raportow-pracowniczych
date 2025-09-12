import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { config } from '../config/app';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

export const validateLogin = [
  body('login')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Login must be between 3 and 50 characters')
    .isAlphanumeric()
    .withMessage('Login must contain only alphanumeric characters'),
  
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
  
  handleValidationErrors
];

export const validateUserCreation = [
  body('login')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Login must be between 3 and 50 characters')
    .isAlphanumeric()
    .withMessage('Login must contain only alphanumeric characters'),
  
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
  
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-']+$/)
    .withMessage('Full name contains invalid characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('role')
    .optional()
    .isIn(['employee', 'coordinator', 'admin'])
    .withMessage('Role must be employee, coordinator, or admin'),
  
  handleValidationErrors
];

export const validateReportCreation = [
  body('report_date')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date'),
  
  body('object_name')
    .trim()
    .isLength({ min: 1, max: config.features.textFieldMaxLength })
    .withMessage(`Object name must be between 1 and ${config.features.textFieldMaxLength} characters`)
    .escape(),
  
  body('work_description')
    .trim()
    .isLength({ min: 1, max: config.features.textFieldMaxLength })
    .withMessage(`Work description must be between 1 and ${config.features.textFieldMaxLength} characters`)
    .escape(),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: config.features.textFieldMaxLength })
    .withMessage(`Notes must not exceed ${config.features.textFieldMaxLength} characters`)
    .escape(),
  
  body('workers')
    .isArray({ min: 1 })
    .withMessage('At least one worker must be assigned'),
  
  body('workers.*.employee_id')
    .isInt({ min: 1 })
    .withMessage('Employee ID must be a positive integer'),
  
  body('workers.*.start_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('workers.*.end_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  
  handleValidationErrors
];

export const validateEmployeeCreation = [
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-']+$/)
    .withMessage('Full name contains invalid characters'),
  
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position must not exceed 100 characters'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters')
    .matches(/^[+]?[0-9\s\-()]+$/)
    .withMessage('Phone number contains invalid characters'),
  
  handleValidationErrors
];

export const validatePasswordChange = [
  body('current_password')
    .isLength({ min: 1 })
    .withMessage('Current password is required'),
  
  body('new_password')
    .isLength({ min: 6, max: 100 })
    .withMessage('New password must be between 6 and 100 characters'),
  
  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];
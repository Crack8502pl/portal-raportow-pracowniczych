import Joi from 'joi';
import { config } from '../config/app';

export const schemas = {
  user: Joi.object({
    login: Joi.string().alphanum().min(3).max(50).required(),
    password: Joi.string().min(6).max(100).required(),
    full_name: Joi.string().min(2).max(100).pattern(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-']+$/).required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('employee', 'coordinator', 'admin').default('employee'),
    is_active: Joi.boolean().default(true)
  }),

  userUpdate: Joi.object({
    full_name: Joi.string().min(2).max(100).pattern(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-']+$/),
    email: Joi.string().email(),
    role: Joi.string().valid('employee', 'coordinator', 'admin'),
    is_active: Joi.boolean()
  }),

  login: Joi.object({
    login: Joi.string().alphanum().min(3).max(50).required(),
    password: Joi.string().min(1).required()
  }),

  passwordChange: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(6).max(100).required(),
    confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
  }),

  employee: Joi.object({
    full_name: Joi.string().min(2).max(100).pattern(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-']+$/).required(),
    position: Joi.string().max(100).allow('', null),
    department: Joi.string().max(100).allow('', null),
    email: Joi.string().email().allow('', null),
    phone: Joi.string().max(20).pattern(/^[+]?[0-9\s\-()]+$/).allow('', null),
    is_active: Joi.boolean().default(true)
  }),

  report: Joi.object({
    report_date: Joi.date().max('now').required(),
    object_name: Joi.string().min(1).max(config.features.textFieldMaxLength).required(),
    work_description: Joi.string().min(1).max(config.features.textFieldMaxLength).required(),
    notes: Joi.string().max(config.features.textFieldMaxLength).allow('', null),
    workers: Joi.array().min(1).items(
      Joi.object({
        employee_id: Joi.number().integer().positive().required(),
        start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        is_creator: Joi.boolean().default(false)
      })
    ).required()
  }).custom((obj, helpers) => {
    // Validate that end_time is after start_time for each worker
    for (const worker of obj.workers) {
      const startTime = worker.start_time.split(':').map(Number);
      const endTime = worker.end_time.split(':').map(Number);
      
      const startMinutes = startTime[0] * 60 + startTime[1];
      const endMinutes = endTime[0] * 60 + endTime[1];
      
      if (endMinutes <= startMinutes) {
        return helpers.error('any.custom', {
          message: `End time must be after start time for all workers`
        });
      }
    }
    
    return obj;
  }),

  reportUpdate: Joi.object({
    object_name: Joi.string().min(1).max(config.features.textFieldMaxLength),
    work_description: Joi.string().min(1).max(config.features.textFieldMaxLength),
    notes: Joi.string().max(config.features.textFieldMaxLength).allow('', null),
    workers: Joi.array().min(1).items(
      Joi.object({
        employee_id: Joi.number().integer().positive().required(),
        start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        is_creator: Joi.boolean().default(false)
      })
    )
  }),

  queryParams: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort_by: Joi.string().valid('created_at', 'report_date', 'object_name', 'created_by').default('created_at'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc'),
    search: Joi.string().max(100).allow(''),
    date_from: Joi.date(),
    date_to: Joi.date().min(Joi.ref('date_from')),
    status: Joi.string().valid('draft', 'sent'),
    created_by: Joi.number().integer().positive()
  }),

  systemSettings: Joi.object({
    smtp_host: Joi.string().hostname(),
    smtp_port: Joi.number().integer().min(1).max(65535),
    smtp_user: Joi.string().email(),
    smtp_password: Joi.string(),
    smtp_secure: Joi.boolean(),
    email_from: Joi.string().email(),
    email_recipients: Joi.string(),
    max_file_size: Joi.number().integer().positive(),
    allowed_extensions: Joi.string(),
    text_field_max_length: Joi.number().integer().min(100).max(1000),
    enable_registration: Joi.boolean(),
    enable_email_notifications: Joi.boolean()
  })
};

export class Validator {
  static validate(schema: Joi.ObjectSchema, data: any): { error?: string; value?: any } {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join('; ');
      return { error: errorMessage };
    }

    return { value };
  }

  static validateUser(data: any) {
    return this.validate(schemas.user, data);
  }

  static validateUserUpdate(data: any) {
    return this.validate(schemas.userUpdate, data);
  }

  static validateLogin(data: any) {
    return this.validate(schemas.login, data);
  }

  static validatePasswordChange(data: any) {
    return this.validate(schemas.passwordChange, data);
  }

  static validateEmployee(data: any) {
    return this.validate(schemas.employee, data);
  }

  static validateReport(data: any) {
    return this.validate(schemas.report, data);
  }

  static validateReportUpdate(data: any) {
    return this.validate(schemas.reportUpdate, data);
  }

  static validateQueryParams(data: any) {
    return this.validate(schemas.queryParams, data);
  }

  static validateSystemSettings(data: any) {
    return this.validate(schemas.systemSettings, data);
  }

  static isValidId(id: any): boolean {
    const parsed = parseInt(id);
    return !isNaN(parsed) && parsed > 0;
  }

  static isValidDate(date: any): boolean {
    if (!date) return false;
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }

  static isValidTimeFormat(time: string): boolean {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidRole(role: string): boolean {
    return ['employee', 'coordinator', 'admin'].includes(role);
  }

  static sanitizeAndValidateFilters(filters: any) {
    const validated: any = {};

    if (filters.search && typeof filters.search === 'string') {
      validated.search = filters.search.trim().substring(0, 100);
    }

    if (filters.date_from && this.isValidDate(filters.date_from)) {
      validated.date_from = new Date(filters.date_from);
    }

    if (filters.date_to && this.isValidDate(filters.date_to)) {
      validated.date_to = new Date(filters.date_to);
    }

    if (filters.status && ['draft', 'sent'].includes(filters.status)) {
      validated.status = filters.status;
    }

    if (filters.created_by && this.isValidId(filters.created_by)) {
      validated.created_by = parseInt(filters.created_by);
    }

    if (filters.employee_id && this.isValidId(filters.employee_id)) {
      validated.employee_id = parseInt(filters.employee_id);
    }

    // Pagination
    validated.page = Math.max(1, parseInt(filters.page) || 1);
    validated.limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));

    // Sorting
    const allowedSortFields = ['created_at', 'report_date', 'object_name', 'created_by'];
    validated.sort_by = allowedSortFields.includes(filters.sort_by) ? filters.sort_by : 'created_at';
    validated.sort_order = ['asc', 'desc'].includes(filters.sort_order) ? filters.sort_order : 'desc';

    return validated;
  }
}

export default Validator;
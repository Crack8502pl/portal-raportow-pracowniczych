import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export class Sanitizer {
  static sanitizeHtml(html: string): string {
    return purify.sanitize(html, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  static sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove script injections
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      // Remove SQL injection patterns
      .replace(/(\b(ALTER|CREATE|DELETE|DROP|EXEC|EXECUTE|INSERT|MERGE|SELECT|UPDATE|UNION|USE)\b)/gi, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  static sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      return '';
    }

    return filename
      // Remove path traversal attempts
      .replace(/\.\./g, '')
      .replace(/[\/\\]/g, '')
      // Remove dangerous characters
      .replace(/[<>:"|?*]/g, '_')
      // Remove control characters
      .replace(/[\x00-\x1f\x80-\x9f]/g, '')
      .trim();
  }

  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }

    return email
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@._-]/g, '');
  }

  static sanitizeNumber(value: any): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  static sanitizeBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    
    return Boolean(value);
  }

  static sanitizeArrayOfStrings(arr: any[]): string[] {
    if (!Array.isArray(arr)) {
      return [];
    }

    return arr
      .filter(item => typeof item === 'string')
      .map(item => this.sanitizeText(item))
      .filter(item => item.length > 0);
  }

  static sanitizeObjectKeys(obj: any, allowedKeys: string[]): any {
    if (!obj || typeof obj !== 'object') {
      return {};
    }

    const sanitized: any = {};
    
    allowedKeys.forEach(key => {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = obj[key];
      }
    });

    return sanitized;
  }

  static validateAndSanitizeReport(data: any) {
    const sanitized = {
      report_date: data.report_date ? new Date(data.report_date) : new Date(),
      object_name: this.sanitizeText(data.object_name || ''),
      work_description: this.sanitizeText(data.work_description || ''),
      notes: data.notes ? this.sanitizeText(data.notes) : null,
      workers: []
    };

    // Validate workers array
    if (Array.isArray(data.workers)) {
      sanitized.workers = data.workers
        .map((worker: any) => ({
          employee_id: this.sanitizeNumber(worker.employee_id),
          start_time: this.sanitizeText(worker.start_time || ''),
          end_time: this.sanitizeText(worker.end_time || ''),
          is_creator: this.sanitizeBoolean(worker.is_creator)
        }))
        .filter((worker: any) => 
          worker.employee_id && 
          worker.start_time && 
          worker.end_time &&
          /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(worker.start_time) &&
          /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(worker.end_time)
        );
    }

    return sanitized;
  }

  static validateAndSanitizeUser(data: any) {
    return {
      login: this.sanitizeText(data.login || '').toLowerCase(),
      password: data.password || '',
      full_name: this.sanitizeText(data.full_name || ''),
      email: this.sanitizeEmail(data.email || ''),
      role: ['employee', 'coordinator', 'admin'].includes(data.role) ? data.role : 'employee',
      is_active: this.sanitizeBoolean(data.is_active !== undefined ? data.is_active : true)
    };
  }

  static validateAndSanitizeEmployee(data: any) {
    return {
      full_name: this.sanitizeText(data.full_name || ''),
      position: data.position ? this.sanitizeText(data.position) : null,
      department: data.department ? this.sanitizeText(data.department) : null,
      email: data.email ? this.sanitizeEmail(data.email) : null,
      phone: data.phone ? this.sanitizeText(data.phone) : null,
      is_active: this.sanitizeBoolean(data.is_active !== undefined ? data.is_active : true)
    };
  }

  static sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    return this.sanitizeText(query)
      // Remove SQL wildcards that could cause performance issues
      .replace(/[%_]/g, '')
      // Limit length
      .substring(0, 100);
  }
}

export default Sanitizer;
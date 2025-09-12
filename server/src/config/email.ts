export const emailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.company.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'reports@company.com',
      pass: process.env.SMTP_PASSWORD || 'smtp_password'
    }
  },
  
  defaults: {
    from: process.env.EMAIL_FROM || 'reports@company.com',
    recipients: (process.env.EMAIL_RECIPIENTS || 'manager@company.com').split(',')
  }
};
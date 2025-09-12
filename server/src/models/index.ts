import sequelize from '../config/database';
import User from './User';
import Employee from './Employee';
import Report from './Report';
import ReportWorker from './ReportWorker';
import ReportAttachment from './ReportAttachment';
import ActivityLog from './ActivityLog';
import SystemSettings from './SystemSettings';

// Define associations
User.hasMany(Report, { foreignKey: 'created_by_user_id', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'createdByUser' });

Report.hasMany(ReportWorker, { foreignKey: 'report_id', as: 'reportWorkers' });
ReportWorker.belongsTo(Report, { foreignKey: 'report_id', as: 'report' });

Employee.hasMany(ReportWorker, { foreignKey: 'employee_id', as: 'reportWorkers' });
ReportWorker.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

Report.hasMany(ReportAttachment, { foreignKey: 'report_id', as: 'reportAttachments' });
ReportAttachment.belongsTo(Report, { foreignKey: 'report_id', as: 'report' });

User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(SystemSettings, { foreignKey: 'updated_by', as: 'systemSettings' });
SystemSettings.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedByUser' });

export {
  sequelize,
  User,
  Employee,
  Report,
  ReportWorker,
  ReportAttachment,
  ActivityLog,
  SystemSettings
};

export default {
  sequelize,
  User,
  Employee,
  Report,
  ReportWorker,
  ReportAttachment,
  ActivityLog,
  SystemSettings
};
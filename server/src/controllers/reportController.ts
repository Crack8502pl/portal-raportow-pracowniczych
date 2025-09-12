import { Response } from 'express';
import { Op } from 'sequelize';
import { Report, ReportWorker, ReportAttachment, Employee, User } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../utils/helpers';
import { Validator } from '../utils/validator';
import { Sanitizer } from '../utils/sanitizer';
import fileService from '../services/fileService';
import emailService from '../services/emailService';
import excelService from '../services/excelService';

export class ReportController {
  async createReport(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      // Validate and sanitize report data
      const reportData = Sanitizer.validateAndSanitizeReport(req.body);
      const { error, value } = Validator.validateReport(reportData);
      
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      // Verify all employees exist
      const employeeIds = value.workers.map((w: any) => w.employee_id);
      const employees = await Employee.findAll({
        where: { id: employeeIds, is_active: true }
      });

      if (employees.length !== employeeIds.length) {
        return ApiResponse.error(res, 'Some employees not found or inactive', 400);
      }

      // Create report
      const report = await Report.create({
        created_by_user_id: userId,
        report_date: value.report_date,
        object_name: value.object_name,
        work_description: value.work_description,
        notes: value.notes,
        status: 'sent'
      });

      // Create report workers
      const reportWorkers = await Promise.all(
        value.workers.map((worker: any) =>
          ReportWorker.create({
            report_id: report.id,
            employee_id: worker.employee_id,
            start_time: worker.start_time,
            end_time: worker.end_time,
            is_creator: worker.is_creator || false
          })
        )
      );

      // Handle file attachments if present
      let attachments: any[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        attachments = await Promise.all(
          req.files.map(async (file: any) => {
            const fileData = await fileService.processUploadedFile(file);
            return ReportAttachment.create({
              report_id: report.id,
              filename: fileData.filename,
              original_name: fileData.originalName,
              file_type: fileData.fileType,
              file_size: fileData.fileSize,
              file_path: fileData.filePath
            });
          })
        );
      }

      // Get complete report data for response and email
      const completeReport = await this.getReportWithDetails(report.id);

      // Send email notification
      try {
        const user = await User.findByPk(userId);
        await emailService.sendReportNotification({
          id: report.id,
          created_by: user?.full_name || 'Unknown',
          report_date: value.report_date,
          object_name: value.object_name,
          work_description: value.work_description,
          notes: value.notes,
          workers: employees.map((emp, idx) => ({
            full_name: emp.full_name,
            start_time: value.workers[employeeIds.indexOf(emp.id)].start_time,
            end_time: value.workers[employeeIds.indexOf(emp.id)].end_time
          }))
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }

      return ApiResponse.success(res, completeReport, 'Report created successfully', 201);

    } catch (error) {
      console.error('Create report error:', error);
      return ApiResponse.error(res, 'Failed to create report');
    }
  }

  async getReports(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      const filters = Validator.sanitizeAndValidateFilters(req.query);
      
      // Build where conditions
      const whereConditions: any = {};
      
      // Role-based access control
      if (userRole === 'employee') {
        whereConditions.created_by_user_id = userId;
      }
      
      // Apply filters
      if (filters.search) {
        whereConditions[Op.or] = [
          { object_name: { [Op.iLike]: `%${filters.search}%` } },
          { work_description: { [Op.iLike]: `%${filters.search}%` } },
          { notes: { [Op.iLike]: `%${filters.search}%` } }
        ];
      }

      if (filters.date_from || filters.date_to) {
        whereConditions.report_date = {};
        if (filters.date_from) {
          whereConditions.report_date[Op.gte] = filters.date_from;
        }
        if (filters.date_to) {
          whereConditions.report_date[Op.lte] = filters.date_to;
        }
      }

      if (filters.status) {
        whereConditions.status = filters.status;
      }

      if (filters.created_by && userRole !== 'employee') {
        whereConditions.created_by_user_id = filters.created_by;
      }

      // Count total records
      const total = await Report.count({ where: whereConditions });

      // Get reports with pagination
      const reports = await Report.findAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'createdByUser',
            attributes: ['full_name', 'email']
          },
          {
            model: ReportWorker,
            as: 'reportWorkers',
            include: [
              {
                model: Employee,
                as: 'employee',
                attributes: ['full_name', 'position']
              }
            ]
          },
          {
            model: ReportAttachment,
            as: 'reportAttachments',
            attributes: ['id', 'filename', 'original_name', 'file_type', 'file_size']
          }
        ],
        order: [[filters.sort_by, filters.sort_order]],
        limit: filters.limit,
        offset: (filters.page - 1) * filters.limit
      });

      const totalPages = Math.ceil(total / filters.limit);

      return ApiResponse.success(res, {
        reports,
        pagination: {
          current_page: filters.page,
          total_pages: totalPages,
          total_records: total,
          records_per_page: filters.limit
        }
      }, 'Reports retrieved successfully');

    } catch (error) {
      console.error('Get reports error:', error);
      return ApiResponse.error(res, 'Failed to retrieve reports');
    }
  }

  async getReportById(req: AuthenticatedRequest, res: Response) {
    try {
      const reportId = parseInt(req.params.id);
      const userId = req.user!.id;
      const userRole = req.user!.role;

      if (!Validator.isValidId(reportId)) {
        return ApiResponse.error(res, 'Invalid report ID', 400);
      }

      const report = await this.getReportWithDetails(reportId);

      if (!report) {
        return ApiResponse.notFound(res, 'Report not found');
      }

      // Check access permissions
      if (userRole === 'employee' && report.created_by_user_id !== userId) {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      return ApiResponse.success(res, report, 'Report retrieved successfully');

    } catch (error) {
      console.error('Get report by ID error:', error);
      return ApiResponse.error(res, 'Failed to retrieve report');
    }
  }

  async updateReport(req: AuthenticatedRequest, res: Response) {
    try {
      const reportId = parseInt(req.params.id);
      const userId = req.user!.id;
      const userRole = req.user!.role;

      if (!Validator.isValidId(reportId)) {
        return ApiResponse.error(res, 'Invalid report ID', 400);
      }

      const report = await Report.findByPk(reportId);
      if (!report) {
        return ApiResponse.notFound(res, 'Report not found');
      }

      // Check permissions - only creator or admin/coordinator can update
      if (userRole === 'employee' && report.created_by_user_id !== userId) {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      // Validate update data
      const updateData = Sanitizer.validateAndSanitizeReport(req.body);
      const { error, value } = Validator.validateReportUpdate(updateData);
      
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      // Create new version
      const newVersion = report.version + 1;

      // Update report
      await report.update({
        ...value,
        version: newVersion,
        updated_at: new Date()
      });

      // Update workers if provided
      if (value.workers) {
        // Delete existing workers
        await ReportWorker.destroy({ where: { report_id: reportId } });
        
        // Create new workers
        await Promise.all(
          value.workers.map((worker: any) =>
            ReportWorker.create({
              report_id: reportId,
              employee_id: worker.employee_id,
              start_time: worker.start_time,
              end_time: worker.end_time,
              is_creator: worker.is_creator || false
            })
          )
        );
      }

      // Get updated report
      const updatedReport = await this.getReportWithDetails(reportId);

      return ApiResponse.success(res, updatedReport, 'Report updated successfully');

    } catch (error) {
      console.error('Update report error:', error);
      return ApiResponse.error(res, 'Failed to update report');
    }
  }

  async deleteReport(req: AuthenticatedRequest, res: Response) {
    try {
      const reportId = parseInt(req.params.id);
      const userId = req.user!.id;
      const userRole = req.user!.role;

      if (!Validator.isValidId(reportId)) {
        return ApiResponse.error(res, 'Invalid report ID', 400);
      }

      const report = await Report.findByPk(reportId);
      if (!report) {
        return ApiResponse.notFound(res, 'Report not found');
      }

      // Check permissions - only creator or admin can delete
      if (userRole !== 'admin' && report.created_by_user_id !== userId) {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      // Get attachments to delete files
      const attachments = await ReportAttachment.findAll({
        where: { report_id: reportId }
      });

      // Delete associated files
      for (const attachment of attachments) {
        await fileService.deleteFile(attachment.file_path);
      }

      // Delete report (cascade will handle workers and attachments)
      await report.destroy();

      return ApiResponse.success(res, null, 'Report deleted successfully');

    } catch (error) {
      console.error('Delete report error:', error);
      return ApiResponse.error(res, 'Failed to delete report');
    }
  }

  async exportReports(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const exportType = req.query.type as string || 'excel';
      
      if (userRole === 'employee') {
        return ApiResponse.forbidden(res, 'Export not allowed for employees');
      }

      const filters = Validator.sanitizeAndValidateFilters(req.query);
      
      // Build where conditions (similar to getReports)
      const whereConditions: any = {};
      
      if (filters.search) {
        whereConditions[Op.or] = [
          { object_name: { [Op.iLike]: `%${filters.search}%` } },
          { work_description: { [Op.iLike]: `%${filters.search}%` } }
        ];
      }

      if (filters.date_from || filters.date_to) {
        whereConditions.report_date = {};
        if (filters.date_from) {
          whereConditions.report_date[Op.gte] = filters.date_from;
        }
        if (filters.date_to) {
          whereConditions.report_date[Op.lte] = filters.date_to;
        }
      }

      if (filters.status) {
        whereConditions.status = filters.status;
      }

      // Get reports for export
      const reports = await Report.findAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'createdByUser',
            attributes: ['full_name']
          },
          {
            model: ReportWorker,
            as: 'reportWorkers',
            include: [
              {
                model: Employee,
                as: 'employee',
                attributes: ['full_name']
              }
            ]
          },
          {
            model: ReportAttachment,
            as: 'reportAttachments',
            attributes: ['original_name', 'file_type', 'file_size']
          }
        ],
        order: [['created_at', 'desc']]
      });

      if (exportType === 'excel') {
        const exportData = reports.map(report => ({
          id: report.id,
          report_date: report.report_date.toISOString().split('T')[0],
          created_by: report.createdByUser?.full_name || 'Unknown',
          object_name: report.object_name,
          work_description: report.work_description,
          notes: report.notes,
          status: report.status,
          version: report.version,
          created_at: report.created_at.toISOString(),
          workers: report.reportWorkers?.map(rw => ({
            full_name: rw.employee?.full_name || 'Unknown',
            start_time: rw.start_time,
            end_time: rw.end_time,
            is_creator: rw.is_creator
          })) || [],
          attachments: report.reportAttachments?.map(att => ({
            original_name: att.original_name,
            file_type: att.file_type,
            file_size: att.file_size
          })) || []
        }));

        const filePath = await excelService.exportReportsToExcel(exportData);
        const filename = `RaportyPracownicze_${new Date().toISOString().split('T')[0]}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        return res.sendFile(filePath);
      }

      return ApiResponse.error(res, 'Unsupported export type', 400);

    } catch (error) {
      console.error('Export reports error:', error);
      return ApiResponse.error(res, 'Failed to export reports');
    }
  }

  async getReportStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      const whereConditions: any = {};
      
      // Role-based access control
      if (userRole === 'employee') {
        whereConditions.created_by_user_id = userId;
      }

      const stats = {
        total_reports: await Report.count({ where: whereConditions }),
        reports_this_month: await Report.count({
          where: {
            ...whereConditions,
            created_at: {
              [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        reports_this_week: await Report.count({
          where: {
            ...whereConditions,
            created_at: {
              [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        draft_reports: await Report.count({
          where: { ...whereConditions, status: 'draft' }
        }),
        sent_reports: await Report.count({
          where: { ...whereConditions, status: 'sent' }
        })
      };

      return ApiResponse.success(res, stats, 'Statistics retrieved successfully');

    } catch (error) {
      console.error('Get report stats error:', error);
      return ApiResponse.error(res, 'Failed to retrieve statistics');
    }
  }

  private async getReportWithDetails(reportId: number) {
    return Report.findByPk(reportId, {
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'full_name', 'email']
        },
        {
          model: ReportWorker,
          as: 'reportWorkers',
          include: [
            {
              model: Employee,
              as: 'employee',
              attributes: ['id', 'full_name', 'position', 'department']
            }
          ]
        },
        {
          model: ReportAttachment,
          as: 'reportAttachments',
          attributes: ['id', 'filename', 'original_name', 'file_type', 'file_size', 'uploaded_at']
        }
      ]
    });
  }
}

export default new ReportController();
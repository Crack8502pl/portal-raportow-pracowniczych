import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

export interface ReportExportData {
  id: number;
  report_date: string;
  created_by: string;
  object_name: string;
  work_description: string;
  notes?: string;
  status: string;
  version: number;
  created_at: string;
  workers: Array<{
    full_name: string;
    start_time: string;
    end_time: string;
    is_creator: boolean;
  }>;
  attachments: Array<{
    original_name: string;
    file_type: string;
    file_size: number;
  }>;
}

class ExcelService {
  private ensureExportDir() {
    const exportDir = path.resolve('./exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    return exportDir;
  }

  async exportReportsToExcel(reports: ReportExportData[], filename?: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Portal Raportów Pracowniczych';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastModifiedBy = 'Portal Raportów Pracowniczych';

    // Create main reports worksheet
    const worksheet = workbook.addWorksheet('Raporty Pracownicze');

    // Define columns
    const columns = [
      { key: 'id', header: 'ID', width: 10 },
      { key: 'report_date', header: 'Data Raportu', width: 15 },
      { key: 'created_by', header: 'Utworzony przez', width: 20 },
      { key: 'object_name', header: 'Nazwa Obiektu', width: 30 },
      { key: 'work_description', header: 'Wykonane Prace', width: 40 },
      { key: 'notes', header: 'Uwagi/Problemy', width: 30 },
      { key: 'workers_count', header: 'Liczba Pracowników', width: 18 },
      { key: 'workers_list', header: 'Lista Pracowników', width: 40 },
      { key: 'total_hours', header: 'Łączne Godziny', width: 15 },
      { key: 'attachments_count', header: 'Liczba Załączników', width: 18 },
      { key: 'version', header: 'Wersja', width: 10 },
      { key: 'status', header: 'Status', width: 12 },
      { key: 'created_at', header: 'Data Utworzenia', width: 18 }
    ];

    worksheet.columns = columns;

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2C3E50' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Add data rows
    reports.forEach((report, index) => {
      const workersText = report.workers.map(w => 
        `${w.full_name} (${w.start_time}-${w.end_time})`
      ).join('; ');

      const totalHours = this.calculateTotalHours(report.workers);

      const rowData = {
        id: report.id,
        report_date: report.report_date,
        created_by: report.created_by,
        object_name: report.object_name,
        work_description: report.work_description,
        notes: report.notes || '',
        workers_count: report.workers.length,
        workers_list: workersText,
        total_hours: totalHours,
        attachments_count: report.attachments.length,
        version: report.version,
        status: report.status === 'sent' ? 'Wysłany' : 'Szkic',
        created_at: new Date(report.created_at).toLocaleString('pl-PL')
      };

      const row = worksheet.addRow(rowData);
      
      // Alternate row coloring
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F8F9FA' }
        };
      }

      // Text wrapping for long content
      row.getCell('object_name').alignment = { wrapText: true, vertical: 'top' };
      row.getCell('work_description').alignment = { wrapText: true, vertical: 'top' };
      row.getCell('notes').alignment = { wrapText: true, vertical: 'top' };
      row.getCell('workers_list').alignment = { wrapText: true, vertical: 'top' };
      
      row.height = 30;
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Add summary worksheet
    const summaryWorksheet = workbook.addWorksheet('Podsumowanie');
    this.createSummarySheet(summaryWorksheet, reports);

    // Generate filename if not provided
    const exportDir = this.ensureExportDir();
    const finalFilename = filename || `RaportyPracownicze_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(exportDir, finalFilename);

    // Save workbook
    await workbook.xlsx.writeFile(filePath);

    return filePath;
  }

  async exportSingleReport(report: ReportExportData): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Portal Raportów Pracowniczych';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Raport Pracowniczy');

    // Create detailed single report layout
    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `RAPORT PRACOWNICZY #${report.id}`;
    titleCell.font = { bold: true, size: 16, color: { argb: '2C3E50' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECF0F1' } };

    let row = 3;

    // Basic information
    const fields = [
      ['Data raportu:', report.report_date],
      ['Utworzony przez:', report.created_by],
      ['Nazwa obiektu:', report.object_name],
      ['Wykonane prace:', report.work_description],
      ['Uwagi/Problemy:', report.notes || 'Brak'],
      ['Wersja:', report.version.toString()],
      ['Status:', report.status === 'sent' ? 'Wysłany' : 'Szkic'],
      ['Data utworzenia:', new Date(report.created_at).toLocaleString('pl-PL')]
    ];

    fields.forEach(([label, value]) => {
      worksheet.getCell(`A${row}`).value = label;
      worksheet.getCell(`A${row}`).font = { bold: true };
      worksheet.getCell(`B${row}`).value = value;
      row++;
    });

    row += 2;

    // Workers section
    worksheet.getCell(`A${row}`).value = 'PRACOWNICY:';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
    row++;

    worksheet.getCell(`A${row}`).value = 'Imię i Nazwisko';
    worksheet.getCell(`B${row}`).value = 'Godzina rozpoczęcia';
    worksheet.getCell(`C${row}`).value = 'Godzina zakończenia';
    worksheet.getCell(`D${row}`).value = 'Czas pracy';
    
    const headerRow = worksheet.getRow(row);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BDC3C7' } };
    row++;

    report.workers.forEach(worker => {
      worksheet.getCell(`A${row}`).value = worker.full_name;
      worksheet.getCell(`B${row}`).value = worker.start_time;
      worksheet.getCell(`C${row}`).value = worker.end_time;
      
      const hours = this.calculateWorkerHours(worker.start_time, worker.end_time);
      worksheet.getCell(`D${row}`).value = `${hours}h`;
      
      if (worker.is_creator) {
        const workerRow = worksheet.getRow(row);
        workerRow.font = { bold: true };
      }
      
      row++;
    });

    // Attachments section
    if (report.attachments.length > 0) {
      row += 2;
      worksheet.getCell(`A${row}`).value = 'ZAŁĄCZNIKI:';
      worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      row++;

      report.attachments.forEach(attachment => {
        worksheet.getCell(`A${row}`).value = `• ${attachment.original_name} (${attachment.file_type}, ${Math.round(attachment.file_size / 1024)} KB)`;
        row++;
      });
    }

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    const exportDir = this.ensureExportDir();
    const sanitizedObjectName = report.object_name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const filename = `RaportPracowniczy_${sanitizedObjectName}_${report.report_date}_${report.id}.xlsx`;
    const filePath = path.join(exportDir, filename);

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  private createSummarySheet(worksheet: ExcelJS.Worksheet, reports: ReportExportData[]) {
    worksheet.mergeCells('A1:C1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'PODSUMOWANIE RAPORTÓW';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    let row = 3;
    
    const stats = [
      ['Łączna liczba raportów:', reports.length],
      ['Raporty wysłane:', reports.filter(r => r.status === 'sent').length],
      ['Raporty w szkicach:', reports.filter(r => r.status === 'draft').length],
      ['Łączna liczba pracowników:', new Set(reports.flatMap(r => r.workers.map(w => w.full_name))).size],
      ['Łączna liczba załączników:', reports.reduce((sum, r) => sum + r.attachments.length, 0)]
    ];

    stats.forEach(([label, value]) => {
      worksheet.getCell(`A${row}`).value = label;
      worksheet.getCell(`A${row}`).font = { bold: true };
      worksheet.getCell(`B${row}`).value = value;
      row++;
    });
  }

  private calculateTotalHours(workers: Array<{ start_time: string; end_time: string }>): string {
    const totalMinutes = workers.reduce((sum, worker) => {
      return sum + this.calculateWorkerMinutes(worker.start_time, worker.end_time);
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  private calculateWorkerHours(startTime: string, endTime: string): number {
    const minutes = this.calculateWorkerMinutes(startTime, endTime);
    return Math.round((minutes / 60) * 100) / 100;
  }

  private calculateWorkerMinutes(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;
    
    return endTotal - startTotal;
  }
}

export default new ExcelService();
import nodemailer from 'nodemailer';
import { emailConfig } from '../config/email';
import { config } from '../config/app';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter(emailConfig.smtp);
  }

  async sendReportNotification(reportData: {
    id: number;
    created_by: string;
    report_date: string;
    object_name: string;
    work_description: string;
    notes?: string;
    workers: Array<{
      full_name: string;
      start_time: string;
      end_time: string;
    }>;
  }) {
    if (!config.features.enableEmailNotifications) {
      console.log('Email notifications disabled');
      return;
    }

    const workersHtml = reportData.workers.map(worker => 
      `<li>${worker.full_name} (${worker.start_time} - ${worker.end_time})</li>`
    ).join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Nowy Raport Pracowniczy</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: #2c3e50; color: white; padding: 20px; margin: -30px -30px 30px; border-radius: 8px 8px 0 0; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #2c3e50; }
            .value { margin-top: 5px; padding: 8px; background-color: #f8f9fa; border-left: 3px solid #3498db; }
            .workers-list { list-style-type: none; padding: 0; }
            .workers-list li { padding: 8px; margin: 5px 0; background-color: #e8f4f8; border-radius: 4px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Nowy Raport Pracowniczy</h1>
                <p>Raport #${reportData.id}</p>
            </div>
            
            <div class="field">
                <div class="label">Data raportu:</div>
                <div class="value">${reportData.report_date}</div>
            </div>
            
            <div class="field">
                <div class="label">Utworzony przez:</div>
                <div class="value">${reportData.created_by}</div>
            </div>
            
            <div class="field">
                <div class="label">Nazwa obiektu:</div>
                <div class="value">${reportData.object_name}</div>
            </div>
            
            <div class="field">
                <div class="label">Wykonane prace:</div>
                <div class="value">${reportData.work_description}</div>
            </div>
            
            ${reportData.notes ? `
            <div class="field">
                <div class="label">Uwagi/Problemy:</div>
                <div class="value">${reportData.notes}</div>
            </div>
            ` : ''}
            
            <div class="field">
                <div class="label">Pracownicy na obiekcie:</div>
                <ul class="workers-list">
                    ${workersHtml}
                </ul>
            </div>
            
            <div class="footer">
                <p>Ten email został wysłany automatycznie z systemu Portal Raportów Pracowniczych.</p>
                <p>Data wysłania: ${new Date().toLocaleString('pl-PL')}</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const textContent = `
Nowy Raport Pracowniczy - Raport #${reportData.id}

Data raportu: ${reportData.report_date}
Utworzony przez: ${reportData.created_by}
Nazwa obiektu: ${reportData.object_name}
Wykonane prace: ${reportData.work_description}
${reportData.notes ? `Uwagi/Problemy: ${reportData.notes}` : ''}

Pracownicy na obiekcie:
${reportData.workers.map(w => `- ${w.full_name} (${w.start_time} - ${w.end_time})`).join('\n')}

Ten email został wysłany automatycznie z systemu Portal Raportów Pracowniczych.
Data wysłania: ${new Date().toLocaleString('pl-PL')}
    `;

    try {
      await this.transporter.sendMail({
        from: emailConfig.defaults.from,
        to: emailConfig.defaults.recipients.join(', '),
        subject: `Raport Pracowniczy #${reportData.id} - ${reportData.object_name}`,
        text: textContent,
        html: htmlContent
      });

      console.log(`Email notification sent for report #${reportData.id}`);
    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection test failed:', error);
      return false;
    }
  }
}

export default new EmailService();
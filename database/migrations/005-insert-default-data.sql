-- Insert default admin user
-- Password: admin123 (hashed with bcrypt, 12 rounds)
INSERT INTO users (login, password_hash, full_name, email, role, is_active) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewaBnBdmcvrIz2XK', 'Administrator Systemu', 'admin@company.com', 'admin', true)
ON CONFLICT (login) DO NOTHING;

-- Insert default coordinator user
-- Password: koord123 (hashed with bcrypt, 12 rounds)
INSERT INTO users (login, password_hash, full_name, email, role, is_active) VALUES
('koordynator', '$2b$12$8Rl.vlbBl3N5TQJYb8vN4.RjJj0.QjgqXcgO5g1DQN9R5qB9.H1Em', 'Koordynator Projektów', 'coordinator@company.com', 'coordinator', true)
ON CONFLICT (login) DO NOTHING;

-- Insert default employee user
-- Password: prac123 (hashed with bcrypt, 12 rounds)
INSERT INTO users (login, password_hash, full_name, email, role, is_active) VALUES
('pracownik', '$2b$12$9M3qE8VgHxY2Bd4M.F9K4.1sT0mCrHxO9j5yHn2Z8T9B4E.R6nK5C', 'Jan Kowalski', 'employee@company.com', 'employee', true)
ON CONFLICT (login) DO NOTHING;

-- Insert sample employees
INSERT INTO employees (full_name, position, department, email, phone, is_active) VALUES
('Jan Kowalski', 'Pracownik budowlany', 'Budowa', 'jan.kowalski@company.com', '+48 123 456 789', true),
('Anna Nowak', 'Elektryk', 'Instalacje elektryczne', 'anna.nowak@company.com', '+48 987 654 321', true),
('Piotr Wiśniewski', 'Hydraulik', 'Instalacje sanitarne', 'piotr.wisniewski@company.com', '+48 555 123 456', true),
('Maria Wójcik', 'Malarz', 'Wykończenia', 'maria.wojcik@company.com', '+48 444 789 123', true),
('Tomasz Kowalczyk', 'Dekarz', 'Dachy', 'tomasz.kowalczyk@company.com', '+48 666 333 999', true),
('Katarzyna Kamińska', 'Tynkarz', 'Wykończenia', 'katarzyna.kaminska@company.com', '+48 777 888 111', true),
('Michał Lewandowski', 'Murarz', 'Budowa', 'michal.lewandowski@company.com', '+48 222 444 666', true),
('Agnieszka Dąbrowska', 'Kierownik budowy', 'Zarządzanie', 'agnieszka.dabrowska@company.com', '+48 111 222 333', true)
ON CONFLICT DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('smtp_host', 'smtp.gmail.com', 'SMTP server hostname'),
('smtp_port', '587', 'SMTP server port'),
('smtp_secure', 'false', 'Use SSL/TLS for SMTP connection'),
('smtp_user', '', 'SMTP username'),
('smtp_password', '', 'SMTP password'),
('email_from', 'reports@company.com', 'Default sender email address'),
('email_recipients', 'manager@company.com,admin@company.com', 'Comma-separated list of email recipients'),
('max_file_size', '5242880', 'Maximum file upload size in bytes (5MB)'),
('allowed_extensions', 'jpg,jpeg,png,pdf,doc,docx,xls,xlsx', 'Allowed file extensions'),
('text_field_max_length', '300', 'Maximum length for text fields'),
('enable_registration', 'false', 'Allow new user registration'),
('enable_email_notifications', 'true', 'Send email notifications for new reports'),
('company_name', 'Firma Budowlana', 'Company name for reports and emails'),
('company_address', 'ul. Budowlana 123, 00-001 Warszawa', 'Company address'),
('company_phone', '+48 22 123 45 67', 'Company phone number'),
('backup_retention_days', '30', 'Number of days to keep backup files'),
('session_timeout_minutes', '60', 'User session timeout in minutes')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert sample report (for demonstration)
WITH sample_user AS (
    SELECT id FROM users WHERE login = 'pracownik' LIMIT 1
)
INSERT INTO reports (created_by_user_id, report_date, object_name, work_description, notes, status) 
SELECT 
    sample_user.id,
    CURRENT_DATE - INTERVAL '1 day',
    'Budowa domu jednorodzinnego ul. Przykładowa 15',
    'Wykonano fundamenty pod budynek mieszkalny. Zalano beton i oczekiwanie na związanie.',
    'Pogoda sprzyjająca, brak problemów technicznych.',
    'sent'
FROM sample_user;

-- Insert sample report workers
WITH sample_report AS (
    SELECT r.id as report_id FROM reports r 
    JOIN users u ON r.created_by_user_id = u.id 
    WHERE u.login = 'pracownik' LIMIT 1
)
INSERT INTO report_workers (report_id, employee_id, start_time, end_time, is_creator)
SELECT 
    sample_report.report_id,
    e.id,
    CASE 
        WHEN e.full_name = 'Jan Kowalski' THEN '07:00'
        ELSE '08:00'
    END,
    CASE 
        WHEN e.full_name = 'Jan Kowalski' THEN '15:30'
        ELSE '16:00'
    END,
    e.full_name = 'Jan Kowalski'
FROM sample_report
CROSS JOIN employees e
WHERE e.full_name IN ('Jan Kowalski', 'Michał Lewandowski', 'Piotr Wiśniewski')
AND e.is_active = true;

-- Update sequences to ensure proper incremental IDs
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));
SELECT setval('reports_id_seq', (SELECT MAX(id) FROM reports));
SELECT setval('report_workers_id_seq', (SELECT MAX(id) FROM report_workers));
SELECT setval('system_settings_id_seq', (SELECT MAX(id) FROM system_settings));
-- Create enum for report status
DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('draft', 'sent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    created_by_user_id INTEGER NOT NULL REFERENCES users(id),
    report_date DATE NOT NULL,
    object_name TEXT NOT NULL,
    work_description TEXT NOT NULL,
    notes TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    status report_status NOT NULL DEFAULT 'sent',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create report_workers table
CREATE TABLE IF NOT EXISTS report_workers (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_creator BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create report_attachments table
CREATE TABLE IF NOT EXISTS report_attachments (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add check constraints for reports
ALTER TABLE reports ADD CONSTRAINT check_object_name_length CHECK (char_length(object_name) >= 1 AND char_length(object_name) <= 300);
ALTER TABLE reports ADD CONSTRAINT check_work_description_length CHECK (char_length(work_description) >= 1 AND char_length(work_description) <= 300);
ALTER TABLE reports ADD CONSTRAINT check_notes_length CHECK (notes IS NULL OR char_length(notes) <= 300);
ALTER TABLE reports ADD CONSTRAINT check_version_positive CHECK (version > 0);

-- Add check constraints for report_workers
ALTER TABLE report_workers ADD CONSTRAINT check_start_before_end CHECK (start_time < end_time);

-- Add check constraints for report_attachments
ALTER TABLE report_attachments ADD CONSTRAINT check_file_size_positive CHECK (file_size > 0);

-- Create indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_created_by_user_id ON reports(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_object_name ON reports USING gin(to_tsvector('english', object_name));
CREATE INDEX IF NOT EXISTS idx_reports_work_description ON reports USING gin(to_tsvector('english', work_description));

-- Create indexes for report_workers
CREATE INDEX IF NOT EXISTS idx_report_workers_report_id ON report_workers(report_id);
CREATE INDEX IF NOT EXISTS idx_report_workers_employee_id ON report_workers(employee_id);
CREATE INDEX IF NOT EXISTS idx_report_workers_is_creator ON report_workers(is_creator);

-- Create indexes for report_attachments
CREATE INDEX IF NOT EXISTS idx_report_attachments_report_id ON report_attachments(report_id);
CREATE INDEX IF NOT EXISTS idx_report_attachments_file_type ON report_attachments(file_type);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
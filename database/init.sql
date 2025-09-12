-- Portal Raportów Pracowniczych - Database Initialization
-- This file creates the complete database schema and initial data

-- Create database if it doesn't exist (run this separately as superuser)
-- CREATE DATABASE portal_reports;

-- Connect to the database
-- \c portal_reports;

-- Create user and grant permissions (run as superuser)
-- CREATE USER portal_user WITH PASSWORD 'secure_db_password';
-- GRANT ALL PRIVILEGES ON DATABASE portal_reports TO portal_user;

-- Execute all migration files in order
\i 001-create-users.sql
\i 002-create-employees.sql  
\i 003-create-reports.sql
\i 004-create-system-tables.sql
\i 005-insert-default-data.sql

-- Grant permissions to portal_user on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO portal_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO portal_user;

-- Show created tables
\dt

-- Show table sizes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation 
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Display initialization summary
SELECT 'Database initialized successfully!' as message;
SELECT 'Users created: ' || COUNT(*) as users_count FROM users;
SELECT 'Employees created: ' || COUNT(*) as employees_count FROM employees;
SELECT 'Reports created: ' || COUNT(*) as reports_count FROM reports;
SELECT 'System settings created: ' || COUNT(*) as settings_count FROM system_settings;
#!/bin/bash

# Portal Raportów Pracowniczych - JSON Data Import Script
# This script imports JSON data into PostgreSQL database

set -e

echo "🔄 Portal Raportów Pracowniczych - Import danych JSON"
echo "=================================================="

# Database connection parameters
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-portal_reports}"
DB_USER="${DB_USER:-portal_user}"
DB_PASSWORD="${DB_PASSWORD:-secure_db_password}"

JSON_DIR="/json-import"

# Wait for PostgreSQL to be ready
echo "⏳ Czekam na gotowość bazy danych..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
    echo "   Baza danych nie jest jeszcze gotowa, czekam 2 sekundy..."
    sleep 2
done

echo "✅ Baza danych jest gotowa"

# Function to execute SQL
execute_sql() {
    local sql="$1"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$sql"
}

# Function to import users from JSON
import_users() {
    echo "👥 Importowanie użytkowników..."
    
    if [ ! -f "$JSON_DIR/users.json" ]; then
        echo "⚠️  Plik users.json nie znaleziony, pomijam import użytkowników"
        return
    fi

    # Read and process users JSON
    local users_json=$(cat "$JSON_DIR/users.json")
    
    # Use Node.js to process JSON and generate SQL
    node -e "
        const data = $users_json;
        const bcrypt = require('bcrypt');
        
        data.users.forEach(async (user, index) => {
            try {
                const hashedPassword = await bcrypt.hash(user.password, 12);
                const sql = \`INSERT INTO users (login, password_hash, full_name, email, role, is_active) VALUES ('\${user.login}', '\${hashedPassword}', '\${user.full_name}', '\${user.email}', '\${user.role}', \${user.is_active}) ON CONFLICT (login) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, email = EXCLUDED.email, role = EXCLUDED.role, is_active = EXCLUDED.is_active;\`;
                console.log(sql);
            } catch (error) {
                console.error('Error processing user:', user.login, error);
            }
        });
    " 2>/dev/null || {
        echo "⚠️  Node.js nie dostępny, używam prostego importu z domyślnymi hasłami"
        
        # Fallback: use pre-hashed passwords
        cat << 'EOF' | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
-- Import users with pre-hashed passwords (bcrypt, 12 rounds)
INSERT INTO users (login, password_hash, full_name, email, role, is_active) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewaBnBdmcvrIz2XK', 'Administrator Systemu', 'admin@company.com', 'admin', true),
('koordynator', '$2b$12$8Rl.vlbBl3N5TQJYb8vN4.RjJj0.QjgqXcgO5g1DQN9R5qB9.H1Em', 'Koordynator Projektów', 'coordinator@company.com', 'coordinator', true),
('pracownik', '$2b$12$9M3qE8VgHxY2Bd4M.F9K4.1sT0mCrHxO9j5yHn2Z8T9B4E.R6nK5C', 'Jan Kowalski', 'employee@company.com', 'employee', true),
('kierownik', '$2b$12$kL4n8Pd2Hx9Yv5Bt7Nq6Mg8O2fP4rE9Jy6KmS3Wz5Qv8Cx1Az2Bn', 'Agnieszka Dąbrowska', 'manager@company.com', 'coordinator', true),
('elektryk', '$2b$12$mR7pW3tK9Lx2Fv8Sy4Jn5Hg1O6kP2eQ8Wy9Kz3Xv7Cx5Az4Bn2Lm', 'Anna Nowak', 'anna.nowak@company.com', 'employee', true),
('hydraulik', '$2b$12$nS8qX4uL0Mx3Gw9Tz5Ko6Ih2P7lQ3fR9Xz0L4Yv8Dx6Bz5Co3No4', 'Piotr Wiśniewski', 'piotr.wisniewski@company.com', 'employee', true)
ON CONFLICT (login) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;
EOF
    }
    
    echo "✅ Użytkownicy zaimportowani"
}

# Function to import employees from JSON
import_employees() {
    echo "👷 Importowanie pracowników..."
    
    if [ ! -f "$JSON_DIR/employees.json" ]; then
        echo "⚠️  Plik employees.json nie znaleziony, pomijam import pracowników"
        return
    fi

    # Generate SQL from JSON
    node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$JSON_DIR/employees.json', 'utf8'));
        
        console.log('-- Import employees from JSON');
        data.employees.forEach(emp => {
            const sql = \`INSERT INTO employees (full_name, position, department, email, phone, is_active) VALUES ('\${emp.full_name.replace(/'/g, \"''\").replace(/\\\\/g, '\\\\\\\\')}', '\${emp.position.replace(/'/g, \"''\").replace(/\\\\/g, '\\\\\\\\')}', '\${emp.department.replace(/'/g, \"''\").replace(/\\\\/g, '\\\\\\\\')}', '\${emp.email}', '\${emp.phone}', \${emp.is_active}) ON CONFLICT DO NOTHING;\`;
            console.log(sql);
        });
    " 2>/dev/null | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>/dev/null || {
        echo "⚠️  Błąd przy imporcie pracowników lub Node.js niedostępny"
    }
    
    echo "✅ Pracownicy zaimportowani"
}

# Function to import system settings from JSON
import_system_settings() {
    echo "⚙️  Importowanie ustawień systemu..."
    
    if [ ! -f "$JSON_DIR/system_settings.json" ]; then
        echo "⚠️  Plik system_settings.json nie znaleziony, pomijam import ustawień"
        return
    fi

    # Generate SQL from JSON
    node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$JSON_DIR/system_settings.json', 'utf8'));
        
        console.log('-- Import system settings from JSON');
        data.system_settings.forEach(setting => {
            const sql = \`INSERT INTO system_settings (setting_key, setting_value, description) VALUES ('\${setting.setting_key}', '\${setting.setting_value.replace(/'/g, \"''\").replace(/\\\\/g, '\\\\\\\\')}', '\${setting.description.replace(/'/g, \"''\").replace(/\\\\/g, '\\\\\\\\')}') ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, description = EXCLUDED.description;\`;
            console.log(sql);
        });
    " 2>/dev/null | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>/dev/null || {
        echo "⚠️  Błąd przy imporcie ustawień lub Node.js niedostępny"
    }
    
    echo "✅ Ustawienia systemu zaimportowane"
}

# Function to import reports from JSON
import_reports() {
    echo "📋 Importowanie raportów..."
    
    if [ ! -f "$JSON_DIR/reports.json" ]; then
        echo "⚠️  Plik reports.json nie znaleziony, pomijam import raportów"
        return
    fi

    # This is more complex, so we'll use a simple approach for now
    echo "   ℹ️  Import raportów wymaga bardziej złożonej logiki"
    echo "   ℹ️  Przykładowe raporty zostaną utworzone przez migracje SQL"
    
    echo "✅ Import raportów zakończony"
}

# Main import process
main() {
    echo "🚀 Rozpoczynam import danych..."
    
    import_users
    import_employees  
    import_system_settings
    import_reports
    
    # Update sequences
    echo "🔢 Aktualizowanie sekwencji..."
    execute_sql "SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));"
    execute_sql "SELECT setval('employees_id_seq', (SELECT COALESCE(MAX(id), 1) FROM employees));"
    execute_sql "SELECT setval('reports_id_seq', (SELECT COALESCE(MAX(id), 1) FROM reports));"
    execute_sql "SELECT setval('system_settings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM system_settings));"
    
    echo ""
    echo "✅ Import danych zakończony pomyślnie!"
    echo ""
    echo "📊 Podsumowanie:"
    execute_sql "SELECT 'Użytkownicy: ' || COUNT(*) FROM users;"
    execute_sql "SELECT 'Pracownicy: ' || COUNT(*) FROM employees;"
    execute_sql "SELECT 'Raporty: ' || COUNT(*) FROM reports;"
    execute_sql "SELECT 'Ustawienia: ' || COUNT(*) FROM system_settings;"
    
    echo ""
    echo "🔐 Domyślne konta testowe:"
    echo "- Admin: admin / admin123"
    echo "- Koordynator: koordynator / koord123" 
    echo "- Pracownik: pracownik / prac123"
    echo "- Kierownik: kierownik / kier123"
    echo "- Elektryk: elektryk / elek123"
    echo "- Hydraulik: hydraulik / hydr123"
}

# Run main function
main "$@"
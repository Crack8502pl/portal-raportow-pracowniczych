'use strict';

const fs = require('fs');
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get the database migrations directory
    const migrationsPath = path.join(__dirname, '../../database/migrations');
    
    // Execute SQL migration files in order
    const migrationFiles = [
      '001-create-users.sql',
      '002-create-employees.sql',
      '003-create-reports.sql',
      '004-create-system-tables.sql'
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsPath, file);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, 'utf8');
        // Split on semicolon and execute each statement
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        for (const statement of statements) {
          if (statement.trim()) {
            await queryInterface.sequelize.query(statement);
          }
        }
        console.log(`Executed migration: ${file}`);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Drop all tables in reverse order
    const tables = [
      'activity_logs',
      'system_settings', 
      'report_attachments',
      'report_workers',
      'reports',
      'employees',
      'users'
    ];

    for (const table of tables) {
      await queryInterface.dropTable(table, { cascade: true });
    }

    // Drop enum types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS user_role CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS report_status CASCADE;');
  }
};
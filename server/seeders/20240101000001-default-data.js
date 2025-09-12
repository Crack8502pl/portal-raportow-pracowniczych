'use strict';

const fs = require('fs');
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Load and execute the default data SQL
    const seedPath = path.join(__dirname, '../../database/migrations/005-insert-default-data.sql');
    
    if (fs.existsSync(seedPath)) {
      const sql = fs.readFileSync(seedPath, 'utf8');
      
      // Split on semicolon and execute each statement
      const statements = sql.split(';').filter(s => s.trim().length > 0);
      for (const statement of statements) {
        if (statement.trim()) {
          await queryInterface.sequelize.query(statement);
        }
      }
      console.log('Default data seeded successfully');
    } else {
      console.log('Default data file not found, skipping seeding');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove seeded data
    await queryInterface.bulkDelete('report_attachments', null, {});
    await queryInterface.bulkDelete('report_workers', null, {});
    await queryInterface.bulkDelete('reports', null, {});
    await queryInterface.bulkDelete('activity_logs', null, {});
    await queryInterface.bulkDelete('employees', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('system_settings', null, {});
  }
};
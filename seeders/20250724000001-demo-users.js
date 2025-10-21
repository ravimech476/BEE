'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 12);
    const customerPassword = await bcrypt.hash('customer123', 12);

    await queryInterface.bulkInsert('tbl_users', [
      {
        username: 'admin',
        password: adminPassword,
        email_id: 'admin@jasmine.com',
        role: 'admin',
        status: 'active',
        created_date: new Date(),
        modified_date: new Date()
      },
      {
        username: 'customer1',
        password: customerPassword,
        email_id: 'customer1@example.com',
        role: 'customer',
        status: 'active',
        created_date: new Date(),
        modified_date: new Date()
      },
      {
        username: 'customer2',
        password: customerPassword,
        email_id: 'customer2@example.com',
        role: 'customer',
        status: 'active',
        created_date: new Date(),
        modified_date: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('tbl_users', null, {});
  }
};
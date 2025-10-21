'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create default roles with granular CRUD permissions
    await queryInterface.bulkInsert('tbl_roles', [
      {
        role_name: 'Super Admin',
        description: 'Full system administrator with all permissions',
        permissions: JSON.stringify({
          dashboard: { view: true },
          users: { view: true, add: true, edit: true, delete: true },
          roles: { view: true, add: true, edit: true, delete: true },
          products: { view: true, add: true, edit: true, delete: true },
          orders: { view: true, add: true, edit: true, delete: true },
          meetings: { view: true, add: true, edit: true, delete: true },
          market_reports: { view: true, add: true, edit: true, delete: true },
          payments: { view: true, add: true, edit: true, delete: true }
        }),
        status: 'active',
        created_date: new Date(),
        modified_date: new Date()
      },
      {
        role_name: 'Sales Manager',
        description: 'Manager with access to sales and order management',
        permissions: JSON.stringify({
          dashboard: { view: true },
          users: { view: false, add: false, edit: false, delete: false },
          roles: { view: false, add: false, edit: false, delete: false },
          products: { view: true, add: true, edit: true, delete: false },
          orders: { view: true, add: true, edit: true, delete: false },
          meetings: { view: true, add: true, edit: true, delete: false },
          market_reports: { view: true, add: true, edit: true, delete: false },
          payments: { view: true, add: true, edit: true, delete: false }
        }),
        status: 'active',
        created_date: new Date(),
        modified_date: new Date()
      },
      {
        role_name: 'Product Manager',
        description: 'Manager with access to product and market data',
        permissions: JSON.stringify({
          dashboard: { view: true },
          users: { view: false, add: false, edit: false, delete: false },
          roles: { view: false, add: false, edit: false, delete: false },
          products: { view: true, add: true, edit: true, delete: true },
          orders: { view: true, add: false, edit: false, delete: false },
          meetings: { view: true, add: true, edit: true, delete: false },
          market_reports: { view: true, add: true, edit: true, delete: true },
          payments: { view: false, add: false, edit: false, delete: false }
        }),
        status: 'active',
        created_date: new Date(),
        modified_date: new Date()
      },
      {
        role_name: 'Customer Service',
        description: 'Customer service representative with limited access',
        permissions: JSON.stringify({
          dashboard: { view: true },
          users: { view: true, add: false, edit: false, delete: false },
          roles: { view: false, add: false, edit: false, delete: false },
          products: { view: true, add: false, edit: false, delete: false },
          orders: { view: true, add: false, edit: true, delete: false },
          meetings: { view: false, add: false, edit: false, delete: false },
          market_reports: { view: false, add: false, edit: false, delete: false },
          payments: { view: true, add: false, edit: true, delete: false }
        }),
        status: 'active',
        created_date: new Date(),
        modified_date: new Date()
      },
      {
        role_name: 'View Only User',
        description: 'Read-only access to most modules',
        permissions: JSON.stringify({
          dashboard: { view: true },
          users: { view: false, add: false, edit: false, delete: false },
          roles: { view: false, add: false, edit: false, delete: false },
          products: { view: true, add: false, edit: false, delete: false },
          orders: { view: true, add: false, edit: false, delete: false },
          meetings: { view: true, add: false, edit: false, delete: false },
          market_reports: { view: true, add: false, edit: false, delete: false },
          payments: { view: true, add: false, edit: false, delete: false }
        }),
        status: 'active',
        created_date: new Date(),
        modified_date: new Date()
      }
    ]);

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await queryInterface.bulkInsert('tbl_users', [
      {
        username: 'admin',
        password: hashedPassword,
        email_id: 'admin@customerconnect.com',
        first_name: 'System',
        last_name: 'Administrator',
        phone: '+1234567890',
        customer_code: 'ADMIN001',
        role: 'admin',
        role_id: 1, // Super Admin role
        status: 'active',
        created_date: new Date(),
        modified_date: new Date()
      },
      {
        username: 'demo_customer',
        password: await bcrypt.hash('demo123', 10),
        email_id: 'customer@demo.com',
        first_name: 'Demo',
        last_name: 'Customer',
        phone: '+1234567891',
        customer_code: 'CUST001',
        role: 'customer',
        status: 'active',
        created_by: 1,
        created_date: new Date(),
        modified_date: new Date()
      },
      {
        username: 'sales_manager',
        password: await bcrypt.hash('sales123', 10),
        email_id: 'sales@demo.com',
        first_name: 'Sales',
        last_name: 'Manager',
        phone: '+1234567892',
        customer_code: 'SALES001',
        role: 'customer',
        role_id: 2, // Sales Manager role
        status: 'active',
        created_by: 1,
        created_date: new Date(),
        modified_date: new Date()
      }
    ]);

    console.log('✓ Successfully seeded admin users and roles with granular permissions');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('tbl_users', {
      username: ['admin', 'demo_customer', 'sales_manager']
    });
    
    await queryInterface.bulkDelete('tbl_roles', {
      role_name: ['Super Admin', 'Sales Manager', 'Product Manager', 'Customer Service', 'View Only User']
    });
  }
};
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    // Sample statements data that matches the actual table structure
    const statements = [
      {
        customer_code: 'CUST001',
        customer_name: 'ABC Corporation Ltd.',
        customer_group: 'Premium',
        outstanding_value: 75000.00,
        invoice_number: 'INV-2025-101',
        invoice_date: new Date('2025-01-15'),
        due_date: new Date('2025-02-15'),
        total_paid_amount: 50000.00,
        status: 'partial',
        created_date: now,
        modified_date: now
      },
      {
        customer_code: 'CUST002',
        customer_name: 'XYZ Industries Pvt Ltd',
        customer_group: 'Standard',
        outstanding_value: 0.00,
        invoice_number: 'INV-2025-102',
        invoice_date: new Date('2025-01-15'),
        due_date: new Date('2025-02-15'),
        total_paid_amount: 85000.00,
        status: 'paid',
        created_date: now,
        modified_date: now
      },
      {
        customer_code: 'CUST003',
        customer_name: 'Global Trading Co.',
        customer_group: 'Premium',
        outstanding_value: 300000.00,
        invoice_number: 'INV-2025-103',
        invoice_date: new Date('2025-01-10'),
        due_date: new Date('2025-02-10'),
        total_paid_amount: 50000.00,
        status: 'partial',
        created_date: now,
        modified_date: now
      },
      {
        customer_code: 'CUST004',
        customer_name: 'Tech Solutions Ltd',
        customer_group: 'Standard',
        outstanding_value: 50000.00,
        invoice_number: 'INV-2025-104',
        invoice_date: new Date('2025-01-20'),
        due_date: new Date('2025-02-20'),
        total_paid_amount: 45000.00,
        status: 'partial',
        created_date: now,
        modified_date: now
      },
      {
        customer_code: 'CUST005',
        customer_name: 'Manufacturing Hub Inc',
        customer_group: 'Premium',
        outstanding_value: 0.00,
        invoice_number: 'INV-2025-105',
        invoice_date: new Date('2025-01-05'),
        due_date: new Date('2025-02-05'),
        total_paid_amount: 175000.00,
        status: 'paid',
        created_date: now,
        modified_date: now
      },
      {
        customer_code: 'CUST006',
        customer_name: 'Retail Chain Stores',
        customer_group: 'Standard',
        outstanding_value: 200000.00,
        invoice_number: 'INV-2025-106',
        invoice_date: new Date('2025-01-25'),
        due_date: new Date('2025-02-25'),
        total_paid_amount: 0.00,
        status: 'pending',
        created_date: now,
        modified_date: now
      },
      {
        customer_code: 'CUST007',
        customer_name: 'Express Logistics',
        customer_group: 'Standard',
        outstanding_value: 20000.00,
        invoice_number: 'INV-2025-107',
        invoice_date: new Date('2025-01-18'),
        due_date: new Date('2025-02-18'),
        total_paid_amount: 90000.00,
        status: 'partial',
        created_date: now,
        modified_date: now
      },
      {
        customer_code: 'CUST008',
        customer_name: 'Construction Materials Co',
        customer_group: 'Premium',
        outstanding_value: 350000.00,
        invoice_number: 'INV-2025-108',
        invoice_date: new Date('2025-01-12'),
        due_date: new Date('2025-02-12'),
        total_paid_amount: 100000.00,
        status: 'partial',
        created_date: now,
        modified_date: now
      },
      {
        customer_code: 'CUST009',
        customer_name: 'Food & Beverages Ltd',
        customer_group: 'Standard',
        outstanding_value: 0.00,
        invoice_number: 'INV-2025-109',
        invoice_date: new Date('2025-01-22'),
        due_date: new Date('2025-02-22'),
        total_paid_amount: 70000.00,
        status: 'paid',
        created_date: now,
        modified_date: now
      },
      {
        customer_code: 'CUST010',
        customer_name: 'Electronics Wholesale',
        customer_group: 'Premium',
        outstanding_value: 180000.00,
        invoice_number: 'INV-2025-110',
        invoice_date: new Date('2025-01-28'),
        due_date: new Date('2025-02-28'),
        total_paid_amount: 100000.00,
        status: 'partial',
        created_date: now,
        modified_date: now
      }
    ];

    // Insert statement records into the correct table name
    await queryInterface.bulkInsert('tbl_statement', statements, {});
  },

  down: async (queryInterface, Sequelize) => {
    // Delete all seeded data
    await queryInterface.bulkDelete('tbl_statement', null, {});
  }
};

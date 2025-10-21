'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const invoices = [
      {
        invoice_number: 'INV-2025-001',
        invoice_date: new Date('2025-01-15'),
        invoice_value: '1500.00',
        invoice_value_inr: '125000.00',
        dispatch_date: new Date('2025-01-16'),
        lr_number: 'LR-001-2025',
        delivery_partner: 'BlueDart Express',
        delivered_date: new Date('2025-01-18'),
        status: 'delivered',
        created_date: now,
        modified_date: now
      },
      {
        invoice_number: 'INV-2025-002',
        invoice_date: new Date('2025-01-17'),
        invoice_value: '2300.00',
        invoice_value_inr: '191500.00',
        dispatch_date: new Date('2025-01-18'),
        lr_number: 'LR-002-2025',
        delivery_partner: 'DHL Express',
        delivered_date: null,
        status: 'dispatched',
        created_date: now,
        modified_date: now
      },
      {
        invoice_number: 'INV-2025-003',
        invoice_date: new Date('2025-01-20'),
        invoice_value: '850.00',
        invoice_value_inr: '70750.00',
        dispatch_date: null,
        lr_number: null,
        delivery_partner: null,
        delivered_date: null,
        status: 'pending',
        created_date: now,
        modified_date: now
      },
      {
        invoice_number: 'INV-2025-004',
        invoice_date: new Date('2025-01-22'),
        invoice_value: '3200.00',
        invoice_value_inr: '266400.00',
        dispatch_date: new Date('2025-01-23'),
        lr_number: 'LR-003-2025',
        delivery_partner: 'FedEx',
        delivered_date: new Date('2025-01-25'),
        status: 'delivered',
        created_date: now,
        modified_date: now
      },
      {
        invoice_number: 'INV-2025-005',
        invoice_date: new Date('2025-01-23'),
        invoice_value: '1750.00',
        invoice_value_inr: '145750.00',
        dispatch_date: new Date('2025-01-24'),
        lr_number: 'LR-004-2025',
        delivery_partner: 'DTDC Courier',
        delivered_date: null,
        status: 'dispatched',
        created_date: now,
        modified_date: now
      },
      {
        invoice_number: 'INV-2025-006',
        invoice_date: new Date('2025-01-24'),
        invoice_value: '920.00',
        invoice_value_inr: '76560.00',
        dispatch_date: null,
        lr_number: null,
        delivery_partner: null,
        delivered_date: null,
        status: 'pending',
        created_date: now,
        modified_date: now
      },
      {
        invoice_number: 'INV-2025-007',
        invoice_date: new Date('2025-01-25'),
        invoice_value: '4500.00',
        invoice_value_inr: '374500.00',
        dispatch_date: new Date('2025-01-25'),
        lr_number: 'LR-005-2025',
        delivery_partner: 'Professional Couriers',
        delivered_date: null,
        status: 'dispatched',
        created_date: now,
        modified_date: now
      },
      {
        invoice_number: 'INV-2025-008',
        invoice_date: new Date('2025-01-26'),
        invoice_value: '1100.00',
        invoice_value_inr: '91500.00',
        dispatch_date: null,
        lr_number: null,
        delivery_partner: null,
        delivered_date: null,
        status: 'pending',
        created_date: now,
        modified_date: now
      }
    ];

    await queryInterface.bulkInsert('tbl_invoice_to_delivery', invoices, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('tbl_invoice_to_delivery', null, {});
  }
};
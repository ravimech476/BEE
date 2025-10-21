'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    // Check if data already exists
    const [existingData] = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM tbl_invoice_to_delivery'
    );
    
    // Only insert if table is empty or has less than 20 records
    if (existingData[0].count < 20) {
      const invoices = [
        {
          invoice_number: 'INV-2025-009',
          invoice_date: new Date('2025-01-26'),
          invoice_value: '2800.00',
          invoice_value_inr: '233200.00',
          dispatch_date: new Date('2025-01-27'),
          lr_number: 'LR-006-2025',
          delivery_partner: 'Gati Express',
          delivered_date: new Date('2025-01-29'),
          status: 'delivered',
          created_date: now,
          modified_date: now
        },
        {
          invoice_number: 'INV-2025-010',
          invoice_date: new Date('2025-01-27'),
          invoice_value: '1950.00',
          invoice_value_inr: '162350.00',
          dispatch_date: new Date('2025-01-28'),
          lr_number: 'LR-007-2025',
          delivery_partner: 'Ecom Express',
          delivered_date: null,
          status: 'dispatched',
          created_date: now,
          modified_date: now
        },
        {
          invoice_number: 'INV-2025-011',
          invoice_date: new Date('2025-01-28'),
          invoice_value: '675.00',
          invoice_value_inr: '56175.00',
          dispatch_date: null,
          lr_number: null,
          delivery_partner: null,
          delivered_date: null,
          status: 'pending',
          created_date: now,
          modified_date: now
        },
        {
          invoice_number: 'INV-2025-012',
          invoice_date: new Date('2025-01-29'),
          invoice_value: '3500.00',
          invoice_value_inr: '291500.00',
          dispatch_date: new Date('2025-01-30'),
          lr_number: 'LR-008-2025',
          delivery_partner: 'India Post',
          delivered_date: new Date('2025-02-02'),
          status: 'delivered',
          created_date: now,
          modified_date: now
        },
        {
          invoice_number: 'INV-2025-013',
          invoice_date: new Date('2025-01-30'),
          invoice_value: '890.00',
          invoice_value_inr: '74070.00',
          dispatch_date: null,
          lr_number: null,
          delivery_partner: null,
          delivered_date: null,
          status: 'pending',
          created_date: now,
          modified_date: now
        },
        {
          invoice_number: 'INV-2025-014',
          invoice_date: new Date('2025-01-31'),
          invoice_value: '5200.00',
          invoice_value_inr: '432800.00',
          dispatch_date: new Date('2025-01-31'),
          lr_number: 'LR-009-2025',
          delivery_partner: 'Aramex',
          delivered_date: null,
          status: 'dispatched',
          created_date: now,
          modified_date: now
        },
        {
          invoice_number: 'INV-2025-015',
          invoice_date: new Date('2025-02-01'),
          invoice_value: '1275.00',
          invoice_value_inr: '106175.00',
          dispatch_date: new Date('2025-02-02'),
          lr_number: 'LR-010-2025',
          delivery_partner: 'Xpressbees',
          delivered_date: new Date('2025-02-04'),
          status: 'delivered',
          created_date: now,
          modified_date: now
        },
        {
          invoice_number: 'INV-2025-016',
          invoice_date: new Date('2025-02-02'),
          invoice_value: '420.00',
          invoice_value_inr: '34980.00',
          dispatch_date: null,
          lr_number: null,
          delivery_partner: null,
          delivered_date: null,
          status: 'pending',
          created_date: now,
          modified_date: now
        },
        {
          invoice_number: 'INV-2025-017',
          invoice_date: new Date('2025-02-03'),
          invoice_value: '6800.00',
          invoice_value_inr: '566200.00',
          dispatch_date: new Date('2025-02-03'),
          lr_number: 'LR-011-2025',
          delivery_partner: 'SafeExpress',
          delivered_date: null,
          status: 'dispatched',
          created_date: now,
          modified_date: now
        },
        {
          invoice_number: 'INV-2025-018',
          invoice_date: new Date('2025-02-04'),
          invoice_value: '990.00',
          invoice_value_inr: '82470.00',
          dispatch_date: new Date('2025-02-05'),
          lr_number: 'LR-012-2025',
          delivery_partner: 'First Flight',
          delivered_date: new Date('2025-02-07'),
          status: 'delivered',
          created_date: now,
          modified_date: now
        },
        {
          invoice_number: 'INV-2025-019',
          invoice_date: new Date('2025-02-05'),
          invoice_value: '3150.00',
          invoice_value_inr: '262350.00',
          dispatch_date: null,
          lr_number: null,
          delivery_partner: null,
          delivered_date: null,
          status: 'pending',
          created_date: now,
          modified_date: now
        },
        {
          invoice_number: 'INV-2025-020',
          invoice_date: new Date('2025-02-06'),
          invoice_value: '7500.00',
          invoice_value_inr: '624500.00',
          dispatch_date: new Date('2025-02-06'),
          lr_number: 'LR-013-2025',
          delivery_partner: 'Delhivery',
          delivered_date: null,
          status: 'dispatched',
          created_date: now,
          modified_date: now
        }
      ];

      await queryInterface.bulkInsert('tbl_invoice_to_delivery', invoices, {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove only the records we added (INV-2025-009 to INV-2025-020)
    await queryInterface.bulkDelete('tbl_invoice_to_delivery', {
      invoice_number: {
        [Sequelize.Op.in]: [
          'INV-2025-009', 'INV-2025-010', 'INV-2025-011', 'INV-2025-012',
          'INV-2025-013', 'INV-2025-014', 'INV-2025-015', 'INV-2025-016',
          'INV-2025-017', 'INV-2025-018', 'INV-2025-019', 'INV-2025-020'
        ]
      }
    }, {});
  }
};
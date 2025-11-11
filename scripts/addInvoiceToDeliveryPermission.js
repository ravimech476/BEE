/**
 * Script to add invoice_to_delivery permission to customer roles
 * 
 * Usage:
 * node scripts/addInvoiceToDeliveryPermission.js
 * 
 * Or with npm:
 * npm run add-invoice-delivery-permission
 */

const { sequelize, Role } = require('../models');
const { Op } = require('sequelize');

async function addInvoiceToDeliveryPermission() {
  try {
    console.log('\n🚀 Starting permission update process...\n');

    // Step 1: Find all active customer roles (non-admin)
    console.log('📋 Step 1: Finding active customer roles...');
    
    const customerRoles = await Role.findAll({
      where: {
        status: 'active',
        role_name: {
          [Op.notLike]: '%admin%'
        }
      }
    });

    if (customerRoles.length === 0) {
      console.log('⚠️  No active customer roles found.');
      console.log('   Please create customer roles first.\n');
      process.exit(0);
    }

    console.log(`✅ Found ${customerRoles.length} active customer role(s):\n`);
    
    customerRoles.forEach((role, index) => {
      console.log(`   ${index + 1}. ID: ${role.id} | Name: ${role.role_name}`);
    });
    console.log('');

    // Step 2: Update each role with invoice_to_delivery permission
    console.log('📝 Step 2: Adding invoice_to_delivery permission...\n');

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const role of customerRoles) {
      try {
        // Parse existing permissions
        let permissions = {};
        
        if (role.permissions) {
          if (typeof role.permissions === 'string') {
            permissions = JSON.parse(role.permissions);
          } else if (typeof role.permissions === 'object') {
            permissions = role.permissions;
          }
        }

        // Check if permission already exists
        if (permissions.invoice_to_delivery && permissions.invoice_to_delivery.view === true) {
          console.log(`   ⏭️  Skipped: ${role.role_name} (already has permission)`);
          skippedCount++;
          continue;
        }

        // Add invoice_to_delivery permission
        permissions.invoice_to_delivery = {
          view: true,
          create: false,
          edit: false,
          delete: false
        };

        // Update the role
        await role.update({
          permissions: permissions,
          modified_date: new Date()
        });

        console.log(`   ✅ Updated: ${role.role_name}`);
        updatedCount++;

      } catch (error) {
        console.log(`   ❌ Error updating ${role.role_name}: ${error.message}`);
        errorCount++;
      }
    }

    // Step 3: Verify changes
    console.log('\n📊 Step 3: Verifying changes...\n');

    const verifyRoles = await Role.findAll({
      where: {
        status: 'active',
        role_name: {
          [Op.notLike]: '%admin%'
        }
      }
    });

    console.log('   Current permissions status:');
    console.log('   ' + '-'.repeat(70));
    console.log('   Role Name                    | invoice_to_delivery.view');
    console.log('   ' + '-'.repeat(70));

    for (const role of verifyRoles) {
      let permissions = {};
      
      if (role.permissions) {
        if (typeof role.permissions === 'string') {
          permissions = JSON.parse(role.permissions);
        } else if (typeof role.permissions === 'object') {
          permissions = role.permissions;
        }
      }

      const hasPermission = permissions.invoice_to_delivery?.view === true;
      const status = hasPermission ? '✅ Enabled' : '❌ Disabled';
      const roleName = role.role_name.padEnd(28);
      
      console.log(`   ${roleName} | ${status}`);
    }
    console.log('   ' + '-'.repeat(70));

    // Summary
    console.log('\n📈 Summary:');
    console.log(`   ✅ Updated: ${updatedCount} role(s)`);
    console.log(`   ⏭️  Skipped: ${skippedCount} role(s) (already had permission)`);
    
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount} role(s)`);
    }

    console.log('\n✨ Permission update completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Customer users need to logout and login again');
    console.log('   2. Check sidebar for "🚚 Invoice to Delivery" menu item');
    console.log('   3. Test the invoice-to-delivery page\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
addInvoiceToDeliveryPermission();

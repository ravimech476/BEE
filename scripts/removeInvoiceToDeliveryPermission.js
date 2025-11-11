/**
 * Script to remove invoice_to_delivery permission from customer roles
 * 
 * Usage:
 * node scripts/removeInvoiceToDeliveryPermission.js
 * 
 * Or with npm:
 * npm run remove-invoice-delivery-permission
 */

const { sequelize, Role } = require('../models');
const { Op } = require('sequelize');

async function removeInvoiceToDeliveryPermission() {
  try {
    console.log('\n🔄 Starting permission removal process...\n');

    // Step 1: Find all active customer roles with the permission
    console.log('📋 Step 1: Finding customer roles with invoice_to_delivery permission...');
    
    const customerRoles = await Role.findAll({
      where: {
        status: 'active',
        role_name: {
          [Op.notLike]: '%admin%'
        }
      }
    });

    if (customerRoles.length === 0) {
      console.log('⚠️  No active customer roles found.\n');
      process.exit(0);
    }

    // Filter roles that have the permission
    const rolesWithPermission = customerRoles.filter(role => {
      let permissions = {};
      
      if (role.permissions) {
        if (typeof role.permissions === 'string') {
          permissions = JSON.parse(role.permissions);
        } else if (typeof role.permissions === 'object') {
          permissions = role.permissions;
        }
      }

      return permissions.invoice_to_delivery !== undefined;
    });

    if (rolesWithPermission.length === 0) {
      console.log('ℹ️  No roles have invoice_to_delivery permission.\n');
      process.exit(0);
    }

    console.log(`✅ Found ${rolesWithPermission.length} role(s) with the permission:\n`);
    
    rolesWithPermission.forEach((role, index) => {
      console.log(`   ${index + 1}. ID: ${role.id} | Name: ${role.role_name}`);
    });
    console.log('');

    // Step 2: Remove invoice_to_delivery permission from each role
    console.log('🗑️  Step 2: Removing invoice_to_delivery permission...\n');

    let removedCount = 0;
    let errorCount = 0;

    for (const role of rolesWithPermission) {
      try {
        // Parse existing permissions
        let permissions = {};
        
        if (role.permissions) {
          if (typeof role.permissions === 'string') {
            permissions = JSON.parse(role.permissions);
          } else if (typeof role.permissions === 'object') {
            permissions = { ...role.permissions };
          }
        }

        // Remove invoice_to_delivery permission
        delete permissions.invoice_to_delivery;

        // Update the role
        await role.update({
          permissions: permissions,
          modified_date: new Date()
        });

        console.log(`   ✅ Removed from: ${role.role_name}`);
        removedCount++;

      } catch (error) {
        console.log(`   ❌ Error removing from ${role.role_name}: ${error.message}`);
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
    console.log('   Role Name                    | invoice_to_delivery permission');
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

      const hasPermission = permissions.invoice_to_delivery !== undefined;
      const status = hasPermission ? '⚠️  Still Present' : '✅ Removed';
      const roleName = role.role_name.padEnd(28);
      
      console.log(`   ${roleName} | ${status}`);
    }
    console.log('   ' + '-'.repeat(70));

    // Summary
    console.log('\n📈 Summary:');
    console.log(`   ✅ Removed: ${removedCount} role(s)`);
    
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount} role(s)`);
    }

    console.log('\n✨ Permission removal completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Customer users need to logout and login again');
    console.log('   2. "Invoice to Delivery" menu item will be hidden\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
removeInvoiceToDeliveryPermission();

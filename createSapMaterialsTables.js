const sequelize = require('./config/database');

const createSapMaterialsTables = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Create tbl_sap_materials table
    console.log('Creating tbl_sap_materials table...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_sap_materials' AND xtype='U')
      BEGIN
        CREATE TABLE tbl_sap_materials (
          id INT IDENTITY(1,1) PRIMARY KEY,
          sap_material_number NVARCHAR(100) NOT NULL UNIQUE,
          status NVARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          created_date DATETIME NOT NULL DEFAULT GETDATE(),
          modified_date DATETIME NOT NULL DEFAULT GETDATE()
        );
      END
    `);
    console.log('✓ tbl_sap_materials table ready\n');

    // Create tbl_product_sap_materials junction table
    console.log('Creating tbl_product_sap_materials table...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_product_sap_materials' AND xtype='U')
      BEGIN
        CREATE TABLE tbl_product_sap_materials (
          id INT IDENTITY(1,1) PRIMARY KEY,
          product_id INT NOT NULL,
          sap_material_id INT NOT NULL,
          created_date DATETIME NOT NULL DEFAULT GETDATE(),
          CONSTRAINT FK_product_sap_materials_product FOREIGN KEY (product_id) 
            REFERENCES tbl_products(id) ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT FK_product_sap_materials_sap FOREIGN KEY (sap_material_id) 
            REFERENCES tbl_sap_materials(id) ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT UQ_product_sap_material UNIQUE (product_id, sap_material_id)
        );
      END
    `);
    console.log('✓ tbl_product_sap_materials table ready\n');

    console.log('========================================');
    console.log('✓ SAP Materials tables created successfully!');
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating tables:', error.message);
    process.exit(1);
  }
};

createSapMaterialsTables();

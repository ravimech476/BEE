const sequelize = require('../config/database');

async function createCompanyNewsTable() {
  try {
    console.log('\n========================================');
    console.log('🚀 CREATING COMPANY_NEWS TABLE');
    console.log('========================================\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected successfully\n');

    // Check if table exists
    const [results] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'company_news'
    `);

    if (results.length > 0) {
      console.log('⚠️  company_news table already exists!');
      console.log('   Dropping and recreating...\n');
      await sequelize.query('DROP TABLE dbo.company_news');
    }

    // Create company_news table
    console.log('📋 Creating company_news table...');
    await sequelize.query(`
      CREATE TABLE dbo.company_news (
        id INT PRIMARY KEY IDENTITY(1,1),
        title NVARCHAR(500) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        excerpt NVARCHAR(MAX) NULL,
        image NVARCHAR(255) NULL,
        category NVARCHAR(100) NULL,
        display_order INT NULL DEFAULT 0,
        status NVARCHAR(20) NOT NULL DEFAULT 'active',
        published_date DATETIME NULL,
        created_date DATETIME NOT NULL DEFAULT GETDATE(),
        modified_date DATETIME NULL,
        created_by INT NULL,
        modified_by INT NULL
      )
    `);
    console.log('✅ Table created\n');

    // Create indexes
    console.log('📊 Creating indexes...');
    await sequelize.query(`
      CREATE INDEX idx_company_news_status 
      ON dbo.company_news(status)
    `);
    await sequelize.query(`
      CREATE INDEX idx_company_news_published_date 
      ON dbo.company_news(published_date)
    `);
    await sequelize.query(`
      CREATE INDEX idx_company_news_category 
      ON dbo.company_news(category)
    `);
    console.log('✅ Indexes created\n');

    // Insert sample data
    console.log('📝 Inserting sample data...');
    await sequelize.query(`
      INSERT INTO dbo.company_news 
      (title, content, excerpt, category, status, published_date, created_by)
      VALUES 
      ('Welcome to Customer Connect', 
       'We are excited to announce the launch of our new Customer Connect platform. This portal will help you manage orders, track shipments, and stay updated with the latest company news.',
       'Introducing our new Customer Connect platform',
       'Company Update',
       'active',
       GETDATE(),
       1),
      ('New Product Launch - Essential Oils',
       'We are proud to introduce our new premium essential oil collection. These high-quality oils are sourced from the best suppliers worldwide and undergo rigorous quality testing.',
       'Premium essential oil collection now available',
       'Product Launch',
       'active',
       GETDATE(),
       1),
      ('Q4 Market Report Available',
       'Our latest quarterly market report is now available. The report covers market trends, pricing analysis, and forecasts for the upcoming quarter.',
       'Q4 market analysis and forecasts',
       'Industry News',
       'active',
       GETDATE(),
       1)
    `);
    console.log('✅ Sample data inserted (3 records)\n');

    // Verify
    console.log('🔍 Verifying table structure...');
    const [columns] = await sequelize.query(`
      SELECT 
        COLUMN_NAME as ColumnName,
        DATA_TYPE as DataType,
        CHARACTER_MAXIMUM_LENGTH as MaxLength,
        IS_NULLABLE as Nullable
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'company_news'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('✅ Table structure verified:');
    console.table(columns);

    // Check data
    const [data] = await sequelize.query(`
      SELECT id, title, category, status, created_date 
      FROM dbo.company_news
    `);
    console.log('\n✅ Sample data verified:');
    console.table(data);

    console.log('\n========================================');
    console.log('✅ SUCCESS! company_news table is ready');
    console.log('========================================\n');
    console.log('📌 Next steps:');
    console.log('   1. Restart your backend server (Ctrl+C then npm start)');
    console.log('   2. Test at: http://localhost:3000/admin/news\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the script
createCompanyNewsTable();

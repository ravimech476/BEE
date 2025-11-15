require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import middleware and routes
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes');
const { sequelize } = require('./models');

// Create Express app
const app = express();

// Security middleware with image-friendly configuration
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", process.env.FRONT_END_URL, "http://localhost:5000"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api', limiter);

// CORS configuration - Allow image loading from frontend
const corsOptions = {
  origin: [process.env.FRONT_END_URL, 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Type', 'Content-Length']
};
app.use(cors(corsOptions));

// Additional CORS headers for static files
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS,POST');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files (for uploaded images/documents)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(['/uploads', '/api/uploads'], express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Customer Connect API',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection and server startup
const PORT = process.env.PORT || 5000;  

const startServer = async () => {
  try {
    console.log('Testing database connection...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully.');

    // Only sync in development mode and only if no tables exist
    if (process.env.NODE_ENV === 'development') {
      try {
        // Check if tables exist by trying to query one
        await sequelize.query('SELECT TOP 1 * FROM tbl_users', { type: sequelize.QueryTypes.SELECT });
        console.log('✓ Database tables already exist, skipping sync.');
      } catch (error) {
        // Tables don't exist, so sync them
        console.log('📋 Creating database tables...');
        await sequelize.sync({ force: false });
        console.log('✓ Database synchronized successfully.');
      }
    }

    // Start server
    app.listen(PORT, '0.0.0.0',() => {
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ API available at: http://localhost:${PORT}/api`);
      console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('✗ Unable to start server:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Database connection troubleshooting:');
      console.log('1. Ensure SQL Server is running');
      console.log('2. Check if SQL Server is accepting TCP/IP connections');
      console.log('3. Verify the host and port in your .env file');
      console.log('4. Check firewall settings');
    }
    
    if (error.message.includes('Login failed')) {
      console.log('\n🔐 Authentication troubleshooting:');
      console.log('1. Verify username and password in .env file');
      console.log('2. Ensure SQL Server Authentication is enabled');
      console.log('3. Try using Windows Authentication if possible');
    }
    
    if (error.message.includes('MS_Description')) {
      console.log('\n📋 Database sync issue detected:');
      console.log('Tables already exist. This is normal after running migrations.');
      console.log('Starting server without sync...');
      
      // Try to start server without sync
      app.listen(PORT, () => {
        console.log(`✓ Server is running on port ${PORT}`);
        console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`✓ API available at: http://localhost:${PORT}/api`);
        console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
      });
      return;
    }
    
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
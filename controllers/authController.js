const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, LoginLog } = require('../models');
const { Op } = require('sequelize');

const authController = {
  // User Registration
  register: async (req, res, next) => {
    try {
      const { username, password, email_id, role = 'customer' } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ username }, { email_id }]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this username or email'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await User.create({
        username,
        password: hashedPassword,
        email_id,
        role,
        status: 'active'
      });

      // Generate token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email_id: user.email_id,
            role: user.role,
            status: user.status
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // User Login
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;

      // Find user with role information
      const user = await User.findOne({ 
        where: { username },
        include: [{
          model: require('../models').Role,
          as: 'userRole',
          attributes: ['id', 'role_name', 'permissions', 'status']
        }]
      });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      await user.update({ last_login_datetime: new Date() });

      // Log login
      await LoginLog.create({
        login_id: user.id,
        login_datetime: new Date(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      // Generate token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Prepare user data with role permissions
      const userData = {
        id: user.id,
        username: user.username,
        email_id: user.email_id,
        role: user.role,
        role_id: user.role_id,
        customer_code: user.customer_code,
        status: user.status
      };

      // Include role permissions if user has a role assigned
      if (user.userRole) {
        userData.userRole = {
          id: user.userRole.id,
          role_name: user.userRole.role_name,
          permissions: user.userRole.permissions,
          status: user.userRole.status
        };
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      next(error);
    }
  },

  // Logout
  logout: async (req, res, next) => {
    try {
      // Find the latest login log entry for this user
      const loginLog = await LoginLog.findOne({
        where: {
          login_id: req.user.id,
          logout_datetime: null
        },
        order: [['login_datetime', 'DESC']]
      });

      if (loginLog) {
        await loginLog.update({ logout_datetime: new Date() });
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current user profile with role permissions
  getProfile: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [{
          model: require('../models').Role,
          as: 'userRole',
          attributes: ['id', 'role_name', 'permissions', 'status']
        }]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prepare user data with role permissions
      const userData = {
        id: user.id,
        username: user.username,
        email_id: user.email_id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        customer_code: user.customer_code,
        role: user.role,
        role_id: user.role_id,
        status: user.status,
        last_login_datetime: user.last_login_datetime,
        created_date: user.created_date
      };

      // Include role permissions if user has a role assigned
      if (user.userRole) {
        userData.userRole = {
          id: user.userRole.id,
          role_name: user.userRole.role_name,
          permissions: user.userRole.permissions,
          status: user.userRole.status
        };
      }

      res.json({
        success: true,
        data: userData
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      next(error);
    }
  },

  // Update user profile
  updateProfile: async (req, res, next) => {
    try {
      const { email_id } = req.body;
      const user = await User.findByPk(req.user.id);

      await user.update({
        email_id: email_id || user.email_id,
        modified_date: new Date()
      });

      const updatedUser = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  },

  // Change password
  changePassword: async (req, res, next) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.id);

      // Verify old password
      const isValidPassword = await bcrypt.compare(oldPassword, user.password);
      
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Invalid old password'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await user.update({
        password: hashedPassword,
        modified_date: new Date()
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current user's role permissions (accessible to all authenticated users)
  getMyRolePermissions: async (req, res, next) => {
    try {
      if (!req.user.role_id) {
        return res.json({
          success: true,
          data: {
            hasRole: false,
            permissions: null,
            message: 'User has no role assigned'
          }
        });
      }

      const user = await User.findByPk(req.user.id, {
        include: [{
          model: require('../models').Role,
          as: 'userRole',
          attributes: ['id', 'role_name', 'permissions', 'status']
        }]
      });

      if (!user || !user.userRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found for current user'
        });
      }

      if (user.userRole.status !== 'active') {
        return res.json({
          success: true,
          data: {
            hasRole: true,
            permissions: null,
            message: 'User role is inactive'
          }
        });
      }

      res.json({
        success: true,
        data: {
          hasRole: true,
          role: {
            id: user.userRole.id,
            role_name: user.userRole.role_name,
            permissions: user.userRole.permissions,
            status: user.userRole.status
          }
        }
      });
    } catch (error) {
      console.error('Error fetching user role permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch role permissions',
        error: error.message
      });
    }
  }
};

module.exports = authController;

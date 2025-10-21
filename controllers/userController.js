const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const userController = {
  // Get all users with pagination and filtering
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      
      if (search) {
        where[Op.or] = [
          { username: { [Op.like]: `%${search}%` } },
          { email_id: { [Op.like]: `%${search}%` } },
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } }
        ];
      }

      if (role) {
        where.role = role;
      }

      if (status) {
        where.status = status;
      }

      const { count, rows: users } = await User.findAndCountAll({
        where,
        include: [{
          model: Role,
          as: 'userRole',
          attributes: ['id', 'role_name', 'permissions']
        }],
        attributes: { exclude: ['password'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_date', 'DESC']]
      });

      res.json({
        users,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id, {
        include: [{
          model: Role,
          as: 'userRole',
          attributes: ['id', 'role_name', 'permissions']
        }],
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  },

  // Create new user
  createUser: async (req, res) => {
    try {
      const { 
        username, 
        password, 
        email_id, 
        first_name, 
        last_name, 
        phone, 
        role, 
        role_id, 
        status = 'active' 
      } = req.body;

      // Check if username or email already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email_id }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'Username or email already exists' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        username,
        password: hashedPassword,
        email_id,
        first_name,
        last_name,
        phone,
        role,
        role_id,
        status,
        created_by: req.user?.id
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser.toJSON();
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  },

  // Update user
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Remove password from update if empty
      if (!updateData.password) {
        delete updateData.password;
      } else {
        // Hash new password
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const [updatedRows] = await User.update(updateData, {
        where: { id }
      });

      if (updatedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = await User.findByPk(id, {
        include: [{
          model: Role,
          as: 'userRole',
          attributes: ['id', 'role_name', 'permissions']
        }],
        attributes: { exclude: ['password'] }
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  },

  // Delete user (soft delete by setting status to inactive)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      const [updatedRows] = await User.update(
        { status: 'inactive' },
        { where: { id } }
      );

      if (updatedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  },

  // Get user permissions
  getUserPermissions: async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id, {
        include: [{
          model: Role,
          as: 'userRole',
          attributes: ['permissions']
        }]
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const permissions = user.userRole?.permissions || {};
      res.json({ permissions });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({ error: 'Failed to fetch user permissions' });
    }
  }
};

module.exports = userController;
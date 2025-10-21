const { Role, User } = require('../models');
const { Op } = require('sequelize');

const roleController = {
  // Get all roles with pagination and filtering
  getAllRoles: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', status = '' } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      
      if (search) {
        where[Op.or] = [
          { role_name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      if (status) {
        where.status = status;
      }

      const { count, rows: roles } = await Role.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_date', 'DESC']]
      });

      res.json({
        roles,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  },

  // Get role by ID
  getRoleById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const role = await Role.findByPk(id, {
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }]
      });

      if (!role) {
        return res.status(404).json({ 
          success: false,
          error: 'Role not found' 
        });
      }

      // For admin interface, return the role directly (compatible with existing frontend)
      // Check if this is likely an admin request (has roles.view permission)
      if (req.user && req.user.role === 'admin') {
        // Return role data in admin-compatible format
        res.json({
          id: role.id,
          role_name: role.role_name,
          description: role.description,
          permissions: role.permissions, // This will use the getter to parse JSON
          status: role.status,
          created_date: role.created_date,
          creator: role.creator
        });
      } else {
        // Return role data in new format for API consistency
        res.json({
          success: true,
          data: {
            id: role.id,
            role_name: role.role_name,
            description: role.description,
            permissions: role.permissions, // This will use the getter to parse JSON
            status: role.status,
            created_date: role.created_date,
            creator: role.creator
          }
        });
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch role' 
      });
    }
  },

  // Create new role
  createRole: async (req, res) => {
    try {
      const { 
        role_name, 
        description, 
        permissions = {
          dashboard: false,
          users: false,
          roles: false,
          products: false,
          orders: false,
          meetings: false,
          market_reports: false,
          payments: false
        }, 
        status = 'active' 
      } = req.body;

      // Check if role name already exists
      const existingRole = await Role.findOne({
        where: { role_name }
      });

      if (existingRole) {
        return res.status(400).json({ 
          error: 'Role name already exists' 
        });
      }

      const newRole = await Role.create({
        role_name,
        description,
        permissions,
        status,
        created_by: req.user?.id
      });

      res.status(201).json(newRole);
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({ error: 'Failed to create role' });
    }
  },

  // Update role
  updateRole: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      const [updatedRows] = await Role.update(updateData, {
        where: { id }
      });

      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Role not found' });
      }

      const updatedRole = await Role.findByPk(id, {
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }]
      });

      res.json(updatedRole);
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ error: 'Failed to update role' });
    }
  },

  // Delete role (soft delete by setting status to inactive)
  deleteRole: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if role is being used by any users
      const usersWithRole = await User.count({
        where: { role_id: id }
      });

      if (usersWithRole > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete role. It is assigned to users.' 
        });
      }

      const [updatedRows] = await Role.update(
        { status: 'inactive' },
        { where: { id } }
      );

      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Role not found' });
      }

      res.json({ message: 'Role deactivated successfully' });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ error: 'Failed to delete role' });
    }
  },

  // Get all active roles for dropdown
  getActiveRoles: async (req, res) => {
    try {
      const roles = await Role.findAll({
        where: { status: 'active' },
        attributes: ['id', 'role_name', 'description'],
        order: [['role_name', 'ASC']]
      });

      res.json(roles);
    } catch (error) {
      console.error('Error fetching active roles:', error);
      res.status(500).json({ error: 'Failed to fetch active roles' });
    }
  }
};

module.exports = roleController;
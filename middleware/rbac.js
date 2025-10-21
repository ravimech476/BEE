const { User, Role } = require('../models');

// Middleware to check if user has admin role
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'userRole'
      }]
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Error in requireAdmin middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check specific module and operation permissions
const requirePermission = (module, operation = 'view') => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'userRole'
        }]
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Admin users have all permissions
      if (user.role === 'admin') {
        return next();
      }

      // Check role-based permissions
      const permissions = user.userRole?.permissions || {};
      
      // Check if module exists and has the required operation
      if (!permissions[module] || !permissions[module][operation]) {
        return res.status(403).json({ 
          error: `Permission denied. Required permission: ${module}.${operation}` 
        });
      }

      next();
    } catch (error) {
      console.error('Error in requirePermission middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Middleware to check if user has any permission for a module
const requireModuleAccess = (module) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'userRole'
        }]
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Admin users have all permissions
      if (user.role === 'admin') {
        return next();
      }

      // Check if user has any permission for the module
      const permissions = user.userRole?.permissions || {};
      const modulePermissions = permissions[module] || {};
      
      const hasAnyPermission = Object.values(modulePermissions).some(permission => permission === true);
      
      if (!hasAnyPermission) {
        return res.status(403).json({ 
          error: `Access denied. No permissions for module: ${module}` 
        });
      }

      next();
    } catch (error) {
      console.error('Error in requireModuleAccess middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Middleware to check multiple permissions (user must have at least one)
const requireAnyPermission = (permissionList) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'userRole'
        }]
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Admin users have all permissions
      if (user.role === 'admin') {
        return next();
      }

      // Check if user has any of the required permissions
      const permissions = user.userRole?.permissions || {};
      
      const hasPermission = permissionList.some(({ module, operation }) => {
        return permissions[module] && permissions[module][operation];
      });
      
      if (!hasPermission) {
        const permissionStrings = permissionList.map(p => `${p.module}.${p.operation}`);
        return res.status(403).json({ 
          error: `Permission denied. Required permissions: ${permissionStrings.join(' or ')}` 
        });
      }

      next();
    } catch (error) {
      console.error('Error in requireAnyPermission middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Middleware to check if user can access resource (owner or admin)
const requireOwnershipOrAdmin = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Admin users can access all resources
      if (user.role === 'admin') {
        return next();
      }

      // Check if user owns the resource
      const resourceOwnerId = await getResourceOwnerId(req);
      
      if (resourceOwnerId && resourceOwnerId == userId) {
        return next();
      }

      return res.status(403).json({ 
        error: 'Access denied. You can only access your own resources.' 
      });
    } catch (error) {
      console.error('Error in requireOwnershipOrAdmin middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

module.exports = {
  requireAdmin,
  requirePermission,
  requireModuleAccess,
  requireAnyPermission,
  requireOwnershipOrAdmin
};
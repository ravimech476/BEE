const { ExpertSetting, SocialMediaLink } = require('../models');

const settingsController = {
  // Expert Settings
  async getExpertSettings(req, res) {
    try {
      let expertSetting = await ExpertSetting.findOne({
        where: { isActive: true }
      });

      // If no settings exist, create default
      if (!expertSetting) {
        expertSetting = await ExpertSetting.create({
          email: '',
          isActive: true
        });
      }

      res.json({
        success: true,
        email: expertSetting.email
      });
    } catch (error) {
      console.error('Error fetching expert settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch expert settings',
        error: error.message
      });
    }
  },

  async updateExpertEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      // First, deactivate all existing settings
      await ExpertSetting.update(
        { isActive: false },
        { where: { isActive: true } }
      );

      // Create or update the expert setting
      const expertSetting = await ExpertSetting.create({
        email: email,
        isActive: true
      });

      res.json({
        success: true,
        message: 'Expert email updated successfully',
        data: {
          id: expertSetting.id,
          email: expertSetting.email
        }
      });
    } catch (error) {
      console.error('Error updating expert email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update expert email',
        error: error.message
      });
    }
  },

  // Social Media Links
  async getSocialMediaLinks(req, res) {
    try {
      const socialMediaLinks = await SocialMediaLink.findAll({
        where: { isActive: true },
        order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        data: socialMediaLinks
      });
    } catch (error) {
      console.error('Error fetching social media links:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch social media links',
        error: error.message
      });
    }
  },

  async addSocialMediaLink(req, res) {
    try {
      const { name, icon, link } = req.body;

      // Validation
      if (!name || !icon || !link) {
        return res.status(400).json({
          success: false,
          message: 'Name, icon, and link are required'
        });
      }

      // URL validation
      try {
        new URL(link);
      } catch (urlError) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid URL'
        });
      }

      // Get the next sort order
      const maxSortOrder = await SocialMediaLink.max('sortOrder', {
        where: { isActive: true }
      });
      const nextSortOrder = (maxSortOrder || 0) + 1;

      const socialMediaLink = await SocialMediaLink.create({
        name: name.trim(),
        icon: icon.trim(),
        link: link.trim(),
        sortOrder: nextSortOrder,
        isActive: true
      });

      res.status(201).json({
        success: true,
        message: 'Social media link added successfully',
        data: socialMediaLink
      });
    } catch (error) {
      console.error('Error adding social media link:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add social media link',
        error: error.message
      });
    }
  },

  async updateSocialMediaLink(req, res) {
    try {
      const { id } = req.params;
      const { name, icon, link } = req.body;

      // Validation
      if (!name || !icon || !link) {
        return res.status(400).json({
          success: false,
          message: 'Name, icon, and link are required'
        });
      }

      // URL validation
      try {
        new URL(link);
      } catch (urlError) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid URL'
        });
      }

      const socialMediaLink = await SocialMediaLink.findOne({
        where: { id: id, isActive: true }
      });

      if (!socialMediaLink) {
        return res.status(404).json({
          success: false,
          message: 'Social media link not found'
        });
      }

      await socialMediaLink.update({
        name: name.trim(),
        icon: icon.trim(),
        link: link.trim()
      });

      res.json({
        success: true,
        message: 'Social media link updated successfully',
        data: socialMediaLink
      });
    } catch (error) {
      console.error('Error updating social media link:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update social media link',
        error: error.message
      });
    }
  },

  async deleteSocialMediaLink(req, res) {
    try {
      const { id } = req.params;

      const socialMediaLink = await SocialMediaLink.findOne({
        where: { id: id, isActive: true }
      });

      if (!socialMediaLink) {
        return res.status(404).json({
          success: false,
          message: 'Social media link not found'
        });
      }

      // Soft delete by setting isActive to false
      await socialMediaLink.update({ isActive: false });

      res.json({
        success: true,
        message: 'Social media link deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting social media link:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete social media link',
        error: error.message
      });
    }
  },

  // Utility method to reorder social media links
  async reorderSocialMediaLinks(req, res) {
    try {
      const { linkIds } = req.body; // Array of IDs in the desired order

      if (!Array.isArray(linkIds)) {
        return res.status(400).json({
          success: false,
          message: 'linkIds must be an array'
        });
      }

      // Update sort order for each link
      for (let i = 0; i < linkIds.length; i++) {
        await SocialMediaLink.update(
          { sortOrder: i + 1 },
          { where: { id: linkIds[i], isActive: true } }
        );
      }

      res.json({
        success: true,
        message: 'Social media links reordered successfully'
      });
    } catch (error) {
      console.error('Error reordering social media links:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reorder social media links',
        error: error.message
      });
    }
  }
};

module.exports = settingsController;
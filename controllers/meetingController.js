const { MeetingMinute, User } = require('../models');
const { Op } = require('sequelize');

const meetingController = {
  // Get all meeting minutes with pagination and filtering
  getAllMeetings: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', status = '', dateFrom = '', dateTo = '' } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { agenda: { [Op.like]: `%${search}%` } },
          { mom_number: { [Op.like]: `%${search}%` } },
          { customer_code: { [Op.like]: `%${search}%` } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (dateFrom || dateTo) {
        where.meeting_date = {};
        if (dateFrom) where.meeting_date[Op.gte] = new Date(dateFrom);
        if (dateTo) where.meeting_date[Op.lte] = new Date(dateTo);
      }

      const { count, rows: meetings } = await MeetingMinute.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name']
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['meeting_date', 'DESC']]
      });

      res.json({
        meetings,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      });
    } catch (error) {
      console.error('Error fetching meeting minutes:', error);
      res.status(500).json({ error: 'Failed to fetch meeting minutes' });
    }
  },

  // Get meeting by ID
  getMeetingById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const meeting = await MeetingMinute.findByPk(id, {
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name']
        }]
      });

      if (!meeting) {
        return res.status(404).json({ error: 'Meeting minute not found' });
      }

      res.json(meeting);
    } catch (error) {
      console.error('Error fetching meeting minute:', error);
      res.status(500).json({ error: 'Failed to fetch meeting minute' });
    }
  },

  // Create new meeting minute
  createMeeting: async (req, res) => {
    try {
      const { 
        mom_number,
        title, 
        meeting_date,
        customer_code,
        attendees = [], 
        agenda, 
        minutes, 
        action_items = [], 
        next_meeting_date,
        status = 'draft',
        attachments = []
      } = req.body;

      const newMeeting = await MeetingMinute.create({
        mom_number,
        title,
        meeting_date,
        customer_code: customer_code || null,
        attendees,
        agenda,
        minutes,
        action_items,
        next_meeting_date,
        status,
        attachments,
        created_by: req.user?.id || 1
      });

      const meetingWithCreator = await MeetingMinute.findByPk(newMeeting.id, {
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name']
        }]
      });

      res.status(201).json(meetingWithCreator);
    } catch (error) {
      console.error('Error creating meeting minute:', error);
      res.status(500).json({ error: 'Failed to create meeting minute' });
    }
  },

  // Update meeting minute
  updateMeeting: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      const [updatedRows] = await MeetingMinute.update(updateData, {
        where: { id }
      });

      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Meeting minute not found' });
      }

      const updatedMeeting = await MeetingMinute.findByPk(id, {
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name']
        }]
      });

      res.json(updatedMeeting);
    } catch (error) {
      console.error('Error updating meeting minute:', error);
      res.status(500).json({ error: 'Failed to update meeting minute' });
    }
  },

  // Delete meeting minute
  deleteMeeting: async (req, res) => {
    try {
      const { id } = req.params;

      const deletedRows = await MeetingMinute.destroy({
        where: { id }
      });

      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Meeting minute not found' });
      }

      res.json({ message: 'Meeting minute deleted successfully' });
    } catch (error) {
      console.error('Error deleting meeting minute:', error);
      res.status(500).json({ error: 'Failed to delete meeting minute' });
    }
  },

  // Get meeting statistics
  getMeetingStats: async (req, res) => {
    try {
      const totalMeetings = await MeetingMinute.count();
      const draftMeetings = await MeetingMinute.count({ where: { status: 'draft' } });
      const finalizedMeetings = await MeetingMinute.count({ where: { status: 'finalized' } });
      const archivedMeetings = await MeetingMinute.count({ where: { status: 'archived' } });

      // Get meetings this month
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const thisMonthMeetings = await MeetingMinute.count({
        where: {
          meeting_date: {
            [Op.gte]: currentMonth
          }
        }
      });

      res.json({
        totalMeetings,
        draftMeetings,
        finalizedMeetings,
        archivedMeetings,
        thisMonthMeetings
      });
    } catch (error) {
      console.error('Error fetching meeting statistics:', error);
      res.status(500).json({ error: 'Failed to fetch meeting statistics' });
    }
  }
};

module.exports = meetingController;
// Middleware to parse FormData fields
const parseFormDataFields = (req, res, next) => {
  if (req.body) {
    // Parse JSON fields
    if (req.body.attendees && typeof req.body.attendees === 'string') {
      try {
        req.body.attendees = JSON.parse(req.body.attendees);
      } catch (e) {
        req.body.attendees = [];
      }
    }
    
    if (req.body.action_items && typeof req.body.action_items === 'string') {
      try {
        req.body.action_items = JSON.parse(req.body.action_items);
      } catch (e) {
        req.body.action_items = [];
      }
    }
    
    if (req.body.existing_attachments && typeof req.body.existing_attachments === 'string') {
      try {
        req.body.existing_attachments = JSON.parse(req.body.existing_attachments);
      } catch (e) {
        req.body.existing_attachments = [];
      }
    }
    
    // Handle empty next_meeting_date
    if (req.body.next_meeting_date === '') {
      req.body.next_meeting_date = null;
    }
    
    // Handle file attachments
    if (req.files && req.files.length > 0) {
      req.body.attachments = req.files.map(file => ({
        name: file.originalname,
        path: file.path,
        filename: file.filename,
        size: file.size,
        url: `/uploads/meetings/${file.filename}`
      }));
    } else {
      req.body.attachments = [];
    }
    
    // Merge with existing attachments if updating
    if (req.body.existing_attachments) {
      req.body.attachments = [...(req.body.existing_attachments || []), ...(req.body.attachments || [])];
      delete req.body.existing_attachments;
    }
  }
  
  next();
};

module.exports = parseFormDataFields;

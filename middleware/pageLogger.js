const { PageLog } = require('../models');

const logPageAccess = async (req, res, next) => {
  try {
    if (req.user) {
      await PageLog.create({
        login_id: req.user.id,
        page_name: req.originalUrl,
        datetime: new Date(),
        session_id: req.sessionID || 'no-session',
        action: req.method
      });
    }
  } catch (error) {
    // Log error but don't block the request
    console.error('Page logging error:', error);
  }
  next();
};

module.exports = logPageAccess;
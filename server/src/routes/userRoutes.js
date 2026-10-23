const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateReminderPreferences } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/reminder-preferences', updateReminderPreferences);

module.exports = router;

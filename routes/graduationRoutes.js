const express = require('express');
const router = express.Router();
const {
  registerGraduation,
  getAllGraduations,
  getGraduationStats,
  deleteGraduation
} = require('../controllers/graduationController');

// Public route - Student registration
router.post('/register', registerGraduation);

// Admin routes
router.get('/all', getAllGraduations);
router.get('/stats', getGraduationStats);
router.delete('/:id', deleteGraduation);

module.exports = router;

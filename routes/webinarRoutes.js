const express = require('express');
const router = express.Router();
const {
  createWebinar,
  getAllWebinars,
  getWebinarBySlug,
  updateWebinar,
  toggleWebinarStatus,
  deleteWebinar
} = require('../controllers/webinarController');

// Create new webinar (Admin only)
router.post('/', createWebinar);

// Get all webinars (Admin only)
router.get('/', getAllWebinars);

// Get webinar by slug (Public - for registration page)
router.get('/slug/:slug', getWebinarBySlug);

// Update webinar (Admin only)
router.put('/:id', updateWebinar);

// Toggle webinar status (Admin only)
router.patch('/:id/toggle', toggleWebinarStatus);

// Delete webinar (Admin only)
router.delete('/:id', deleteWebinar);

module.exports = router;

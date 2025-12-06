const express = require('express');
const router = express.Router();
const { 
  registerStudent, 
  verifyStudentEmail, 
  markInstagramFollowed,
  getStudentById 
} = require('../controllers/studentController');

// Register new student
router.post('/register', registerStudent);

// Verify student email (for Instagram flow)
router.post('/verify-email', verifyStudentEmail);

// Mark Instagram as followed
router.post('/instagram-verified', markInstagramFollowed);

// Get student by ID (for certificate verification)
router.get('/:id', getStudentById);

module.exports = router;

const express = require('express');
const router = express.Router();
const { 
  adminLogin, 
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent, 
  toggleEligibility, 
  sendCertificateEmail,
  getDashboardStats
} = require('../controllers/adminController');

// Admin login
router.post('/login', adminLogin);

// Get all students
router.get('/students', getAllStudents);

// Create student (Chennai admin can add)
router.post('/students', createStudent);

// Update student (Chennai admin can edit)
router.put('/students/:id', updateStudent);

// Delete student (Admin can delete)
router.delete('/students/:id', deleteStudent);

// Get dashboard stats
router.get('/stats', getDashboardStats);

// Toggle eligibility (Coimbatore admin only)
router.patch('/students/:id/eligibility', toggleEligibility);

// Send certificate email (Coimbatore admin only)
router.post('/students/:id/send-certificate', sendCertificateEmail);

module.exports = router;

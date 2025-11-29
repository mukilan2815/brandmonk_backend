const express = require('express');
const router = express.Router();
const {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  adminLogin
} = require('../controllers/adminController');

router.post('/login', adminLogin);
router.get('/students', getStudents);
router.post('/students', addStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

module.exports = router;

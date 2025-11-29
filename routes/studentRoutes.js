const express = require('express');
const router = express.Router();
const { verifyStudent, getStudentById } = require('../controllers/studentController');

router.post('/verify', verifyStudent);
router.get('/:id', getStudentById);

module.exports = router;

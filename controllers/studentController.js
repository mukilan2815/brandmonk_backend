const Student = require('../models/Student');

// @desc    Verify student by email
// @route   POST /api/students/verify
// @access  Public
const verifyStudent = async (req, res) => {
  const { email } = req.body;

  try {
    const student = await Student.findOne({ email });

    if (student) {
      res.json({
        success: true,
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          course: student.course,
          dateOfCompletion: student.dateOfCompletion,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'Student not found with this email.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student by ID for certificate verification
// @route   GET /api/students/:id
// @access  Public
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (student) {
      res.json({
        success: true,
        student: {
          name: student.name,
          course: student.course,
          dateOfCompletion: student.dateOfCompletion,
          createdAt: student.createdAt
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'Certificate not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Invalid Certificate ID' });
  }
};

module.exports = { verifyStudent, getStudentById };

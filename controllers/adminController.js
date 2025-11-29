const Student = require('../models/Student');

// @desc    Admin Login (Simple hardcoded for demo)
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  
  // Hardcoded admin credentials for simplicity as requested "2 login" but didn't specify auth complexity
  // In a real app, use a database and bcrypt
  if (email === 'admin@brandmonk.com' && password === 'admin123') {
    res.json({
      success: true,
      token: 'dummy-admin-token', // In real app, use JWT
      admin: { email: 'admin@brandmonk.com' }
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Admin)
const getStudents = async (req, res) => {
  try {
    const students = await Student.find({});
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a student
// @route   POST /api/admin/students
// @access  Private (Admin)
const addStudent = async (req, res) => {
  const { name, email, course } = req.body;

  try {
    const studentExists = await Student.findOne({ email });

    if (studentExists) {
      return res.status(400).json({ message: 'Student already exists' });
    }

    const student = await Student.create({
      name,
      email,
      course,
    });

    if (student) {
      res.status(201).json(student);
    } else {
      res.status(400).json({ message: 'Invalid student data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a student
// @route   PUT /api/admin/students/:id
// @access  Private (Admin)
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (student) {
      student.name = req.body.name || student.name;
      student.email = req.body.email || student.email;
      student.course = req.body.course || student.course;

      const updatedStudent = await student.save();
      res.json(updatedStudent);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a student
// @route   DELETE /api/admin/students/:id
// @access  Private (Admin)
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (student) {
      await student.deleteOne();
      res.json({ message: 'Student removed' });
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  adminLogin,
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
};

const express = require('express');
const router = express.Router();
const CourseStudent = require('../models/CourseStudent');

// @desc    Get all course students
// @route   GET /api/course-students
// @access  Private (Admin only)
router.get('/', async (req, res) => {
  try {
    const students = await CourseStudent.find({}).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: students.length,
      students: students.map(s => ({
        _id: s._id.toString(),
        name: s.name,
        courseName: s.courseName,
        courseSlug: s.courseSlug,
        certificateId: s.certificateId,
        isEligible: s.isEligible,
        certificateSent: s.certificateSent,
        dateOfRegistration: s.dateOfRegistration,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error("GetCourseStudents Error:", error);
    res.status(200).json({ 
      success: false, 
      message: 'Failed to fetch course students',
      students: []
    });
  }
});

// @desc    Get course students by course slug
// @route   GET /api/course-students/course/:slug
// @access  Private (Admin only)
router.get('/course/:slug', async (req, res) => {
  try {
    const students = await CourseStudent.find({ courseSlug: req.params.slug }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: students.length,
      students: students.map(s => ({
        _id: s._id.toString(),
        name: s.name,
        courseName: s.courseName,
        courseSlug: s.courseSlug,
        certificateId: s.certificateId,
        isEligible: s.isEligible,
        certificateSent: s.certificateSent,
        dateOfRegistration: s.dateOfRegistration,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error("GetCourseStudentsByCourse Error:", error);
    res.status(200).json({ 
      success: false, 
      message: 'Failed to fetch course students',
      students: []
    });
  }
});

// @desc    Get single course student by ID
// @route   GET /api/course-students/:id
// @access  Public (for QR verification)
router.get('/:id', async (req, res) => {
  try {
    let student;
    
    // Try finding by certificateId first (for QR scans)
    student = await CourseStudent.findOne({ certificateId: req.params.id });

    // If not found and it looks like a Mongo ID, try that
    if (!student && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      student = await CourseStudent.findById(req.params.id);
    }

    if (student) {
      res.json({
        success: true,
        student: {
          _id: student._id,
          name: student.name,
          courseName: student.courseName,
          courseSlug: student.courseSlug,
          certificateId: student.certificateId,
          isEligible: student.isEligible,
          dateOfRegistration: student.dateOfRegistration || student.createdAt
        }
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Certificate not found.' 
      });
    }
  } catch (error) {
    console.error("GetCourseStudentById Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
});

// @desc    Add a course student
// @route   POST /api/course-students
// @access  Private (Admin only)
router.post('/', async (req, res) => {
  const { name, courseName, courseSlug } = req.body;

  if (!name || !courseName || !courseSlug) {
    return res.status(400).json({
      success: false,
      message: 'Name, courseName, and courseSlug are required'
    });
  }

  try {
    // Generate certificate ID
    const count = await CourseStudent.countDocuments({ courseSlug });
    const prefix = courseSlug === 'video-editing' ? 'BMAVE' : 'BMADM';
    const certificateId = `${prefix}${(count + 1).toString().padStart(4, '0')}`;

    const student = new CourseStudent({
      name: name.trim(),
      courseName: courseName.trim(),
      courseSlug: courseSlug.trim(),
      certificateId,
      isEligible: true,
      dateOfRegistration: new Date()
    });

    const savedStudent = await student.save();

    res.status(201).json({
      success: true,
      message: 'Course student added successfully!',
      student: savedStudent
    });
  } catch (error) {
    console.error("CreateCourseStudent Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to add course student'
    });
  }
});

// @desc    Delete a course student
// @route   DELETE /api/course-students/:id
// @access  Private (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const result = await CourseStudent.findByIdAndDelete(req.params.id);

    if (result) {
      res.json({
        success: true,
        message: 'Course student deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Course student not found'
      });
    }
  } catch (error) {
    console.error("DeleteCourseStudent Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course student'
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const CourseStudent = require('../models/CourseStudent');

const FIXED_CERTIFICATE_ISSUE_DATE = new Date('2026-01-12T00:00:00.000Z');

const MANUAL_CERTIFICATE_REGISTRY = {
  'BMAJUNDMMES/Q0506S021': { name: 'Amuthamalar.R', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S054': { name: 'Ashiquah S', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S063': { name: 'Yuvarani.P', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S064': { name: 'A. Sherwin rose', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S065': { name: 'T. Pandurangan', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S066': { name: 'Lavanya N', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S067': { name: 'N BALAMURUGAN', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S068': { name: 'Kavinsanjay M V', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S069': { name: 'Antony Xavier Prasath R', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S070': { name: 'M Saranraj', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S071': { name: 'Praveen Kumar P', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S072': { name: 'Yuvarekha A', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S073': { name: 'Jabez Sahaya Selvan', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S074': { name: 'G.tharun', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S075': { name: 'Anbarasy J', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S076': { name: 'HariPriya P', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S077': { name: 'Shanmugam P', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S078': { name: 'Premalatha D', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S079': { name: 'Suganya C', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S080': { name: 'S. Anitha Preethi', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNDMMES/Q0506S081': { name: 'Hari pradheesh', courseName: 'Digital Marketing', courseSlug: 'digital-marketing' },
  'BMAJUNVEMES/Q1401S013': { name: 'S.MUTHUKUMAR', courseName: 'Video Editing', courseSlug: 'video-editing' },
  'BMAJUNVEMES/Q1401S014': { name: 'SURESH P', courseName: 'Video Editing', courseSlug: 'video-editing' },
  'BMAJUNVEMES/Q1401S015': { name: 'Karthick E', courseName: 'Video Editing', courseSlug: 'video-editing' },
  'BMAJUNVEMES/Q1401S016': { name: 'K Sowmiya', courseName: 'Video Editing', courseSlug: 'video-editing' },
  'BMAJUNVEMES/Q1401S017': { name: 'Lokesh S', courseName: 'Video Editing', courseSlug: 'video-editing' },
  'BMAJUNVEMES/Q1401S018': { name: 'Shalini.K', courseName: 'Video Editing', courseSlug: 'video-editing' }
};

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
    
    // Decode the ID - the frontend double-encodes to preserve slashes,
    // so we must decode once here to get the actual certificate ID
    const rawId = req.params.id;
    const decodedId = decodeURIComponent(rawId);

    // Try finding by certificateId (decoded first, then raw as fallback)
    student = await CourseStudent.findOne({ certificateId: decodedId });

    if (!student && decodedId !== rawId) {
      student = await CourseStudent.findOne({ certificateId: rawId });
    }

    // Fallback registry for manually generated certificates.
    const manualStudent = MANUAL_CERTIFICATE_REGISTRY[decodedId] || MANUAL_CERTIFICATE_REGISTRY[rawId];

    // If not found and it looks like a Mongo ID, try that
    if (!student && rawId.match(/^[0-9a-fA-F]{24}$/)) {
      student = await CourseStudent.findById(rawId);
    }

    if (student || manualStudent) {
      const responseStudent = student
        ? {
            _id: student._id,
            name: student.name,
            courseName: student.courseName,
            courseSlug: student.courseSlug,
            certificateId: student.certificateId,
            isEligible: student.isEligible,
            dateOfRegistration: student.dateOfRegistration || student.createdAt
          }
        : {
            _id: `manual-${(decodedId || rawId).replace(/[^a-zA-Z0-9]/g, '')}`,
            name: manualStudent.name,
            courseName: manualStudent.courseName,
            courseSlug: manualStudent.courseSlug,
            certificateId: decodedId || rawId,
            isEligible: true,
            dateOfRegistration: FIXED_CERTIFICATE_ISSUE_DATE
          };

      // For this requested set, enforce a fixed issue date.
      if (MANUAL_CERTIFICATE_REGISTRY[responseStudent.certificateId]) {
        responseStudent.dateOfRegistration = FIXED_CERTIFICATE_ISSUE_DATE;
      }

      res.json({
        success: true,
        student: responseStudent
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

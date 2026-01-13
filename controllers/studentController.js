const Student = require('../models/Student');
const Webinar = require('../models/Webinar');
const { backupStudent } = require('../services/firebaseBackup');

// Generate certificate ID


// @desc    Register a new student
// @route   POST /api/students/register
// @access  Public
const registerStudent = async (req, res) => {
  console.log("Register Request:", req.body);
  const { 
    name, 
    email, 
    phone, 
    webinarSlug, 
    location, 
    profession,
    collegeOrCompany,
    department,
    yearOfStudyOrExperience 
  } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !webinarSlug || !location || !profession) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }

  try {
    // Get webinar details from slug
    const webinar = await Webinar.findOne({ slug: webinarSlug, isActive: true });

    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: 'Webinar not found or registration closed'
      });
    }

    // Generate Certificate ID manually
    console.log("Generating Certificate ID for registration...");
    let certificateId = '';
    
    // Find the highest certificate ID by fetching all matching IDs and finding max in JS
    // (MongoDB aggregation $toInt fails on large numbers that overflow 32-bit int)
    const allCertIds = await Student.find(
      { certificateId: { $regex: /^SMAPARMQ076\d+$/ } },
      { certificateId: 1 }
    ).lean();
    
    let nextNum = 1;
    if (allCertIds.length > 0) {
      let maxNum = 0;
      for (const doc of allCertIds) {
        const match = doc.certificateId.match(/SMAPARMQ076(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      nextNum = maxNum + 1;
    }
    
    console.log("Next Certificate Number:", nextNum);

    // Ensure uniqueness by checking if the ID exists and incrementing
    let isUnique = false;
    let attempts = 0;
    
    // High retry limit for concurrent registrations
    while (!isUnique && attempts < 200) {
      const potentialId = `SMAPARMQ076${nextNum.toString().padStart(3, '0')}`;
      const existing = await Student.findOne({ certificateId: potentialId });
      
      if (!existing) {
        certificateId = potentialId;
        isUnique = true;
        console.log("Generated Certificate ID:", certificateId);
      } else {
        nextNum++;
        attempts++;
      }
    }

    if (!isUnique) {
      throw new Error('Unable to generate unique Certificate ID');
    }
    
    const studentData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      webinarId: webinar._id,
      webinarName: webinar.name,
      webinarSlug: webinarSlug,
      location: location.trim(),
      profession,
      collegeOrCompany: collegeOrCompany?.trim() || '',
      department: department?.trim() || '',
      yearOfStudyOrExperience: yearOfStudyOrExperience?.trim() || '',
      certificateId, // Explicitly set generated ID
      isEligible: false,
      hasFollowedInstagram: false,
      certificateSent: false,
      dateOfRegistration: new Date()
    };

    const student = new Student({
      ...studentData,
    });
    const savedStudent = await student.save();
    
    // Backup to Firebase (fire-and-forget)
    backupStudent(savedStudent).catch(err => console.error('Firebase backup error:', err.message));
    
    // Update webinar count
    await Webinar.findByIdAndUpdate(webinar._id, {
      $inc: { totalRegistrations: 1 }
    });
    
    console.log("Student Registered:", savedStudent._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      student: {
        _id: savedStudent._id,
        name: savedStudent.name,
        email: savedStudent.email,
        webinarName: savedStudent.webinarName,
        certificateId: savedStudent.certificateId
      }
    });
  } catch (error) {
    console.error("Register Student Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.',
      error: error.message
    });
  }
};

// @desc    Verify student by email for Instagram flow
// @route   POST /api/students/verify-email
// @access  Public
const verifyStudentEmail = async (req, res) => {
  const { email, certificateId } = req.body;
  console.log("Verify Email Request:", email || certificateId);

  try {
    let student = null;
    
    if (email) {
      student = await Student.findOne({ email: email.trim().toLowerCase() });
    } else if (certificateId) {
      student = await Student.findOne({ certificateId });
    }

    if (student) {
      res.json({
        success: true,
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          webinarName: student.webinarName,
          certificateId: student.certificateId,
          hasFollowedInstagram: student.hasFollowedInstagram || false,
          isEligible: student.isEligible || false
        }
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'No registration found with this email. Please register first.' 
      });
    }
  } catch (error) {
    console.error("Verify Student Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Verification failed. Please try again.' 
    });
  }
};

// @desc    Mark Instagram as followed
// @route   POST /api/students/instagram-verified
// @access  Public
const markInstagramFollowed = async (req, res) => {
  const { studentId } = req.body;
  console.log("Instagram Verified Request:", studentId);

  try {
    const student = await Student.findByIdAndUpdate(
      studentId,
      { hasFollowedInstagram: true },
      { new: true }
    );

    if (student) {
      // Backup updated student to Firebase (fire-and-forget)
      backupStudent(student).catch(err => console.error('Firebase backup error:', err.message));
      
      res.json({
        success: true,
        message: 'Instagram verification complete!',
        student: {
          _id: student._id,
          name: student.name,
          certificateId: student.certificateId,
          hasFollowedInstagram: true
        }
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Student not found.' 
      });
    }
  } catch (error) {
    console.error("Instagram Verify Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Verification failed. Please try again.' 
    });
  }
};

// @desc    Get student by ID for certificate verification page
// @route   GET /api/students/:id
// @access  Public
const getStudentById = async (req, res) => {
  console.log("GetStudentById Request ID:", req.params.id);
  try {
    let student;
    
    // Try finding by certificateId first (most likely for QR scans)
    student = await Student.findOne({ certificateId: req.params.id });

    // If not found, and it looks like a Mongo ID, try that
    if (!student && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        student = await Student.findById(req.params.id);
    }

    if (student) {
      res.json({
        success: true,
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          webinarName: student.webinarName,
          certificateId: student.certificateId,
          profession: student.profession,
          location: student.location,
          certificateType: student.certificateType,
          dateOfRegistration: student.dateOfRegistration || student.createdAt,
          isEligible: student.isEligible || false
        }
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Certificate not found.' 
      });
    }
  } catch (error) {
    console.error("GetStudentById Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

module.exports = { 
  registerStudent, 
  verifyStudentEmail, 
  markInstagramFollowed,
  getStudentById 
};

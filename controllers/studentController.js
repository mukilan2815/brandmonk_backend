const Student = require('../models/Student');
const Webinar = require('../models/Webinar');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/students.json');
const WEBINAR_FILE = path.join(__dirname, '../data/webinars.json');

// Helper to ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Helper to read data
const readData = () => {
  try {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]');
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error("Error reading data file:", err);
    return [];
  }
};

// Helper to write data
const writeData = (data) => {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing data file:", err);
  }
};

// Read webinars data
const readWebinars = () => {
  try {
    if (!fs.existsSync(WEBINAR_FILE)) {
      return [];
    }
    const data = fs.readFileSync(WEBINAR_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error("Error reading webinars file:", err);
    return [];
  }
};

// Update webinar registration count
const updateWebinarCount = (slug) => {
  try {
    const data = readWebinars();
    const index = data.findIndex(w => w.slug === slug);
    if (index !== -1) {
      data[index].totalRegistrations = (data[index].totalRegistrations || 0) + 1;
      fs.writeFileSync(WEBINAR_FILE, JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Error updating webinar count:", err);
  }
};

// Generate certificate ID
const generateCertificateId = async () => {
  let count = 0;
  try {
    count = await Student.countDocuments();
  } catch (e) {
    const fileData = readData();
    count = fileData.length;
  }
  const sequenceNumber = (count + 1).toString().padStart(3, '0');
  return `SMAPARMQ076${sequenceNumber}`;
};

// @desc    Register a new student
// @route   POST /api/students/register
// @access  Public
const registerStudent = async (req, res) => {
  console.log("Register Request:", req.body);
  const { name, email, phone, webinarSlug, location, profession } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !webinarSlug || !location || !profession) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }

  try {
    // Get webinar details from slug
    let webinar = null;
    try {
      webinar = await Webinar.findOne({ slug: webinarSlug, isActive: true });
    } catch (e) {
      console.log("MongoDB webinar lookup failed, trying file:", e.message);
    }

    if (!webinar) {
      const webinars = readWebinars();
      webinar = webinars.find(w => w.slug === webinarSlug && w.isActive);
    }

    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: 'Webinar not found or registration closed'
      });
    }

    const certificateId = await generateCertificateId();
    
    const studentData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      webinarId: webinar._id,
      webinarName: webinar.name,
      webinarSlug: webinarSlug,
      location: location.trim(),
      profession,
      certificateId,
      isEligible: false,
      hasFollowedInstagram: false,
      certificateSent: false,
      dateOfRegistration: new Date()
    };

    let savedStudent;

    // Try MongoDB first
    try {
      const student = new Student({
        ...studentData,
        certificateId: undefined // Let pre-save hook generate it
      });
      savedStudent = await student.save();
      
      // Update webinar count
      try {
        await Webinar.findByIdAndUpdate(webinar._id, {
          $inc: { totalRegistrations: 1 }
        });
      } catch (e) {
        console.error("Failed to update webinar count in MongoDB:", e.message);
      }
      
      // Backup to file
      const currentData = readData();
      writeData([...currentData, { ...savedStudent._doc }]);
      
      console.log("Student Registered via MongoDB:", savedStudent._id);
    } catch (dbError) {
      console.error("MongoDB failed, using local file storage:", dbError.message);
      
      // Fallback to file storage
      studentData._id = Date.now().toString();
      studentData.createdAt = new Date().toISOString(); // Explicitly set createdAt
      const currentData = readData();
      writeData([...currentData, studentData]);
      savedStudent = studentData;
      
      // Update webinar count in file
      updateWebinarCount(webinarSlug);
      
      console.log("Student Registered via Local File:", savedStudent._id);
    }

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
      message: 'Registration failed. Please try again.' 
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
    
    // Try MongoDB first
    try {
      if (email) {
        student = await Student.findOne({ email: email.trim().toLowerCase() });
      } else if (certificateId) {
        student = await Student.findOne({ certificateId });
      }
    } catch (e) {
      console.error("MongoDB Verify Error:", e.message);
    }

    // Fallback to file
    if (!student) {
      const data = readData();
      if (email) {
        student = data.find(s => s.email.toLowerCase() === email.trim().toLowerCase());
      } else if (certificateId) {
        student = data.find(s => s.certificateId === certificateId);
      }
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
    let student = null;

    // Try MongoDB first
    try {
      if (studentId.match(/^[0-9a-fA-F]{24}$/)) {
        student = await Student.findByIdAndUpdate(
          studentId,
          { hasFollowedInstagram: true },
          { new: true }
        );
      }
    } catch (e) {
      console.error("MongoDB Instagram Update Error:", e.message);
    }

    // Fallback to file
    if (!student) {
      const data = readData();
      const index = data.findIndex(s => s._id === studentId || s._id.toString() === studentId);
      
      if (index !== -1) {
        data[index].hasFollowedInstagram = true;
        writeData(data);
        student = data[index];
      }
    }

    if (student) {
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
  try {
    let student = null;
    
    // Try MongoDB first
    try {
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        student = await Student.findById(req.params.id);
      }
    } catch (e) {
      console.error("MongoDB GetById Error:", e.message);
    }

    // Fallback to file
    if (!student) {
      const data = readData();
      student = data.find(s => s._id === req.params.id || s._id.toString() === req.params.id);
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
      message: 'Invalid Certificate ID' 
    });
  }
};

module.exports = { 
  registerStudent, 
  verifyStudentEmail, 
  markInstagramFollowed,
  getStudentById 
};

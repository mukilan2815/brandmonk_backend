const Student = require('../models/Student');
const Admin = require('../models/Admin');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/students.json');

// Helper to read data
const readData = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
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
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing data file:", err);
  }
};

// Admin credentials (in production, use bcrypt and proper auth)
const ADMIN_CREDENTIALS = {
  'chennai_admin': {
    password: 'chennai@123',
    location: 'Chennai',
    role: 'viewer'
  },
  'coimbatore_admin': {
    password: 'coimbatore@123',
    location: 'Coimbatore',
    role: 'manager'
  }
};

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  const { username, password } = req.body;
  console.log("Admin Login Attempt:", { username, password: password ? '***' : 'missing' });
  console.log("Available usernames:", Object.keys(ADMIN_CREDENTIALS));

  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username and password are required' 
    });
  }

  const admin = ADMIN_CREDENTIALS[username];
  console.log("Found admin:", admin ? admin.location : 'NOT FOUND');
  console.log("Password match:", admin && admin.password === password);
  
  if (admin && admin.password === password) {
    console.log("Login SUCCESS for:", username);
    res.json({
      success: true,
      admin: {
        username,
        location: admin.location,
        role: admin.role
      }
    });
  } else {
    console.log("Login FAILED for:", username);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid credentials' 
    });
  }
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Admin only)
const getAllStudents = async (req, res) => {
  try {
    let mongoStudents = [];
    let fileStudents = [];
    
    // Try MongoDB first
    try {
      mongoStudents = await Student.find({}).sort({ createdAt: -1 });
      mongoStudents = mongoStudents.map(s => ({
        ...s._doc,
        _id: s._id.toString()
      }));
    } catch (e) {
      console.error("MongoDB GetAll Error:", e.message);
    }

    // Also read from file
    fileStudents = readData();

    // Merge both sources, removing duplicates by email+webinar
    // Same student can register for different webinars, but not same webinar twice
    const studentMap = new Map();
    
    // Create unique key from email + webinar
    const getKey = (s) => `${(s.email || '').toLowerCase()}_${(s.webinarName || '').toLowerCase()}`;
    
    // Add all students, keeping most recent by date
    const allStudents = [...mongoStudents, ...fileStudents];
    
    allStudents.forEach(s => {
      const key = getKey(s);
      if (!studentMap.has(key)) {
        studentMap.set(key, s);
      } else {
        // Keep the one with the newer date
        const existing = studentMap.get(key);
        const existingDate = new Date(existing.dateOfRegistration || existing.createdAt || 0);
        const newDate = new Date(s.dateOfRegistration || s.createdAt || 0);
        if (newDate > existingDate) {
          studentMap.set(key, s);
        }
      }
    });

    // Convert map to array and sort by date
    const students = Array.from(studentMap.values()).map(s => ({
      ...s,
      createdAt: s.createdAt || s.dateOfRegistration || new Date().toISOString() // Fallback to now if missing
    })).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    console.log(`GetAllStudents: Found ${mongoStudents.length} from MongoDB, ${fileStudents.length} from file, ${students.length} total (after dedup)`);

    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error("GetAllStudents Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch students' 
    });
  }
};


// @desc    Create a new student (Admin manually adds)
// @route   POST /api/admin/students
// @access  Private (Admin only - Chennai can add)
const createStudent = async (req, res) => {
  console.log("Admin Create Student:", req.body);
  const { name, email, phone, webinarName, location, profession } = req.body;

  if (!name || !email || !phone || !webinarName || !location || !profession) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  try {
    // Generate certificate ID
    let count = 0;
    try {
      count = await Student.countDocuments();
    } catch (e) {
      count = readData().length;
    }
    const certificateId = `SMAPARMQ076${(count + 1).toString().padStart(3, '0')}`;

    const studentData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      webinarName: webinarName.trim(),
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
      const student = new Student(studentData);
      savedStudent = await student.save();
      
      // Backup to file
      const currentData = readData();
      writeData([...currentData, { ...savedStudent._doc }]);
    } catch (dbError) {
      console.error("MongoDB Create Error:", dbError.message);
      
      // Fallback to file
      studentData._id = Date.now().toString();
      const currentData = readData();
      writeData([...currentData, studentData]);
      savedStudent = studentData;
    }

    res.status(201).json({
      success: true,
      message: 'Student added successfully!',
      student: savedStudent
    });
  } catch (error) {
    console.error("CreateStudent Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to add student'
    });
  }
};

// @desc    Update student details
// @route   PUT /api/admin/students/:id
// @access  Private (Admin only - Chennai can edit)
const updateStudent = async (req, res) => {
  const studentId = req.params.id;
  console.log("Admin Update Student:", studentId, req.body);
  const { name, email, phone, webinarName, location, profession } = req.body;

  try {
    let student = null;
    const updateData = {
      ...(name && { name: name.trim() }),
      ...(email && { email: email.trim().toLowerCase() }),
      ...(phone && { phone: phone.trim() }),
      ...(webinarName && { webinarName: webinarName.trim() }),
      ...(location && { location: location.trim() }),
      ...(profession && { profession })
    };

    // Try MongoDB first
    try {
      if (studentId.match(/^[0-9a-fA-F]{24}$/)) {
        student = await Student.findByIdAndUpdate(studentId, updateData, { new: true });
      }
    } catch (e) {
      console.error("MongoDB Update Error:", e.message);
    }

    // Fallback to file
    if (!student) {
      const data = readData();
      const index = data.findIndex(s => s._id === studentId || s._id.toString() === studentId);
      
      if (index !== -1) {
        data[index] = { ...data[index], ...updateData };
        writeData(data);
        student = data[index];
      }
    }

    if (student) {
      res.json({
        success: true,
        message: 'Student updated successfully!',
        student
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
  } catch (error) {
    console.error("UpdateStudent Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student'
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
// @access  Private (Admin only)
const deleteStudent = async (req, res) => {
  const studentId = req.params.id;
  console.log("Admin Delete Student:", studentId);

  try {
    let deleted = false;

    // Try MongoDB first
    try {
      if (studentId.match(/^[0-9a-fA-F]{24}$/)) {
        const result = await Student.findByIdAndDelete(studentId);
        if (result) deleted = true;
      }
    } catch (e) {
      console.error("MongoDB Delete Error:", e.message);
    }

    // Also delete from file
    const data = readData();
    const newData = data.filter(s => s._id !== studentId && s._id?.toString() !== studentId);
    if (newData.length < data.length) {
      writeData(newData);
      deleted = true;
    }

    if (deleted) {
      res.json({
        success: true,
        message: 'Student deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
  } catch (error) {
    console.error("DeleteStudent Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student'
    });
  }
};

// @desc    Toggle eligibility for certificate
// @route   PATCH /api/admin/students/:id/eligibility
// @access  Private (Coimbatore Admin only)
const toggleEligibility = async (req, res) => {
  const { isEligible } = req.body;
  const studentId = req.params.id;
  console.log("Toggle Eligibility:", studentId, isEligible);

  try {
    let student = null;

    // When turning off eligibility, also reset certificateSent so email can be sent again
    const updateData = { 
      isEligible,
      ...(isEligible === false && { certificateSent: false, certificateSentAt: null })
    };

    // Try MongoDB first
    try {
      if (studentId.match(/^[0-9a-fA-F]{24}$/)) {
        student = await Student.findByIdAndUpdate(
          studentId,
          updateData,
          { new: true }
        );
      }
    } catch (e) {
      console.error("MongoDB Toggle Error:", e.message);
    }

    // Fallback to file
    if (!student) {
      const data = readData();
      const index = data.findIndex(s => s._id === studentId || s._id.toString() === studentId);
      
      if (index !== -1) {
        data[index].isEligible = isEligible;
        if (isEligible === false) {
          data[index].certificateSent = false;
          data[index].certificateSentAt = null;
        }
        writeData(data);
        student = data[index];
      }
    }

    if (student) {
      res.json({
        success: true,
        message: `Certificate eligibility ${isEligible ? 'approved' : 'revoked'}`,
        student: {
          ...student._doc || student,
          certificateSent: isEligible === false ? false : student.certificateSent
        }
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }
  } catch (error) {
    console.error("ToggleEligibility Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update eligibility' 
    });
  }
};


// @desc    Send certificate email
// @route   POST /api/admin/students/:id/send-certificate
// @access  Private (Coimbatore Admin only)
const sendCertificateEmail = async (req, res) => {
  const studentId = req.params.id;
  console.log("Send Certificate Email:", studentId);

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error("Resend not configured! Set RESEND_API_KEY in .env");
    return res.status(500).json({
      success: false,
      message: 'Email service not configured. Please set RESEND_API_KEY in environment variables.'
    });
  }

  try {
    let student = null;

    // Try MongoDB first
    try {
      if (studentId.match(/^[0-9a-fA-F]{24}$/)) {
        student = await Student.findById(studentId);
      }
    } catch (e) {
      console.error("MongoDB Find Error:", e.message);
    }

    // Fallback to file
    if (!student) {
      const data = readData();
      student = data.find(s => s._id === studentId || s._id.toString() === studentId);
    }

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    if (!student.isEligible) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student is not marked eligible for certificate' 
      });
    }

    console.log("Sending email to:", student.email);
    console.log("Using Resend API");

    // Check if using Resend's testing domain (only allows sending to your own email)
    // The test email registered with Resend - update this to your Resend account email
    const RESEND_TEST_EMAIL = process.env.RESEND_TEST_EMAIL || 'mukilan2808@gmail.com';
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    // If using the default testing domain, warn about the limitation
    if (FROM_EMAIL.includes('resend.dev') && student.email.toLowerCase() !== RESEND_TEST_EMAIL.toLowerCase()) {
      console.warn("⚠️ Resend Test Mode: Can only send to", RESEND_TEST_EMAIL);
      return res.status(400).json({ 
        success: false, 
        message: `⚠️ Resend Test Mode Active! You can only send test emails to ${RESEND_TEST_EMAIL}. To send emails to other recipients:\n\n1. Go to resend.com/domains\n2. Verify your domain (e.g., brandmonkacademy.com)\n3. Add RESEND_FROM_EMAIL=hello@yourdomain.com to your .env file`
      });
    }

    // Handle undefined values with fallbacks
    const webinarName = student.webinarName || 'Brand Monk Academy Program';
    const certificateId = student.certificateId || `BMA-${Date.now()}`;
    const studentName = student.name || 'Participant';
    
    // Determine program type (Course vs Webinar)
    const programType = (student.webinarName && student.webinarName.toLowerCase().includes('course')) ? 'Course' : 'Webinar';

    const issueDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Initialize Resend client
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Create certificate download link
    const certificateUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificate/${student._id}`;
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${student._id}`;

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: `Brand Monk Academy <${FROM_EMAIL}>`,
      to: [student.email],
      subject: `🎉 Congratulations! Your ${programType} Certificate is Ready | Brand Monk Academy`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>

<body style="margin:0; padding:0; background:#f5f5f5; font-family:'Poppins', 'Segoe UI', Arial, sans-serif;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;">
    <tr>
      <td align="center" style="padding:20px;">
        
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:0; overflow:hidden;">

          <!-- ========== WHITE HEADER WITH LOGO & DATE ========== -->
          <tr>
            <td style="background:#ffffff; padding:20px 30px; border-bottom:1px solid #eee;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="width:50%;">
                    <img src="https://brandmonkacademy.com/wp-content/uploads/2023/09/cropped-BMA-Logo-01-01-768x228-1.png"
                         alt="Brand Monk Academy" 
                         style="height:80px; width:auto;">
                  </td>
                  <td align="right" style="width:50%; font-size:13px; color:#666;">
                    ${issueDate}
                  </td>
                </tr>
              </table>
            </td>
          </tr>


          <!-- ========== TEAL GRADIENT BANNER ========== -->
          <tr>
            <td style="background:linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%); padding:40px 35px; text-align:center;">
              
              <h1 style="margin:0 0 15px; font-size:28px; color:#ffffff; font-weight:700; letter-spacing:-0.5px;">
                🎉 Certificate of Completion
              </h1>
              
              <p style="margin:0 0 25px; font-size:14px; color:rgba(255,255,255,0.9); line-height:1.7; max-width:480px; margin-left:auto; margin-right:auto;">
                Congratulations <strong>${studentName}</strong>! You have successfully completed the <strong>${webinarName}</strong> ${programType.toLowerCase()}. Your dedication to learning and growth is truly commendable.
              </p>
              
              <a href="${certificateUrl}" 
                 style="
                   display:inline-block;
                   background:#fbbf24;
                   color:#1f2937;
                   text-decoration:none;
                   padding:14px 35px;
                   font-size:14px;
                   font-weight:600;
                   border-radius:30px;
                   box-shadow:0 4px 15px rgba(251,191,36,0.4);
                 ">
                Download Certificate
              </a>
            </td>
          </tr>

          <!-- ========== SECTION 1: TEXT LEFT, IMAGE RIGHT ========== -->
          <tr>
            <td style="background:#fef9c3; padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding:35px 25px 35px 35px; vertical-align:middle;">
                    <h2 style="margin:0 0 12px; font-size:20px; color:#1f2937; font-weight:700;">
                      Your Achievement
                    </h2>
                    <p style="margin:0 0 8px; font-size:13px; color:#1f2937; font-weight:600;">
                      Certificate ID: <span style="color:#0d9488;">${certificateId}</span>
                    </p>
                    <p style="margin:0 0 20px; font-size:13px; color:#6b7280; line-height:1.6;">
                      This certificate validates your successful completion of the program conducted by Brand Monk Academy.
                    </p>
                    <a href="${verifyUrl}" 
                       style="
                         display:inline-block;
                         background:#10b981;
                         color:#ffffff;
                         text-decoration:none;
                         padding:12px 28px;
                         font-size:13px;
                         font-weight:600;
                         border-radius:25px;
                       ">
                      Verify Certificate
                    </a>
                  </td>
                  <td width="50%" style="padding:0; vertical-align:middle;">
                    <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=220&fit=crop&q=80" 
                         alt="Achievement" 
                         style="width:100%; height:auto; display:block;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ========== SECTION 2: IMAGE LEFT, TEXT RIGHT ========== -->
          <tr>
            <td style="background:#fef9c3; padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding:0; vertical-align:middle;">
                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=220&fit=crop&q=80" 
                         alt="Learning" 
                         style="width:100%; height:auto; display:block;">
                  </td>
                  <td width="50%" style="padding:35px 35px 35px 25px; vertical-align:middle;">
                    <h2 style="margin:0 0 12px; font-size:20px; color:#1f2937; font-weight:700;">
                      Program Details
                    </h2>
                    <p style="margin:0 0 8px; font-size:13px; color:#1f2937; font-weight:600;">
                      ${webinarName}
                    </p>
                    <p style="margin:0 0 20px; font-size:13px; color:#6b7280; line-height:1.6;">
                      Issued on ${issueDate} by Brand Monk Academy. Share your achievement with the world!
                    </p>
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl)}" 
                       style="
                         display:inline-block;
                         background:#10b981;
                         color:#ffffff;
                         text-decoration:none;
                         padding:12px 28px;
                         font-size:13px;
                         font-weight:600;
                         border-radius:25px;
                       ">
                      Share on LinkedIn
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ========== THREE COLUMN GRID: "WHAT'S NEXT" ========== -->
          <tr>
            <td style="background:#ffffff; padding:40px 25px;">
              
              <h2 style="margin:0 0 30px; font-size:22px; color:#0d9488; font-weight:700; text-align:center;">
                What's Next For You
              </h2>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Card 1 -->
                  <td width="33%" style="padding:0 8px; vertical-align:top; text-align:center;">
                    <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=180&h=120&fit=crop&q=80" 
                         alt="Keep Learning" 
                         style="width:100%; height:auto; border-radius:8px; margin-bottom:12px;">
                    <p style="margin:0 0 5px; font-size:13px; color:#f97316; font-weight:600;">
                      Keep Learning
                    </p>
                    <p style="margin:0 0 12px; font-size:11px; color:#6b7280; line-height:1.5;">
                      Explore more courses and webinars to expand your skills
                    </p>
                    <a href="https://brandmonkacademy.com" 
                       style="
                         display:inline-block;
                         background:#10b981;
                         color:#ffffff;
                         text-decoration:none;
                         padding:10px 20px;
                         font-size:12px;
                         font-weight:600;
                         border-radius:20px;
                       ">
                      Explore Courses
                    </a>
                  </td>
                  
                  <!-- Card 2 -->
                  <td width="33%" style="padding:0 8px; vertical-align:top; text-align:center;">
                    <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=180&h=120&fit=crop&q=80" 
                         alt="Join Community" 
                         style="width:100%; height:auto; border-radius:8px; margin-bottom:12px;">
                    <p style="margin:0 0 5px; font-size:13px; color:#f97316; font-weight:600;">
                      Join Our Community
                    </p>
                    <p style="margin:0 0 12px; font-size:11px; color:#6b7280; line-height:1.5;">
                      Connect with fellow learners and industry experts
                    </p>
                    <a href="https://instagram.com/brandmonkacademy" 
                       style="
                         display:inline-block;
                         background:#10b981;
                         color:#ffffff;
                         text-decoration:none;
                         padding:10px 20px;
                         font-size:12px;
                         font-weight:600;
                         border-radius:20px;
                       ">
                      Follow Us
                    </a>
                  </td>
                  
                  <!-- Card 3 -->
                  <td width="33%" style="padding:0 8px; vertical-align:top; text-align:center;">
                    <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=180&h=120&fit=crop&q=80" 
                         alt="Get Certified" 
                         style="width:100%; height:auto; border-radius:8px; margin-bottom:12px;">
                    <p style="margin:0 0 5px; font-size:13px; color:#f97316; font-weight:600;">
                      Showcase Your Skills
                    </p>
                    <p style="margin:0 0 12px; font-size:11px; color:#6b7280; line-height:1.5;">
                      Add this certificate to your LinkedIn profile
                    </p>
                    <a href="${certificateUrl}" 
                       style="
                         display:inline-block;
                         background:#10b981;
                         color:#ffffff;
                         text-decoration:none;
                         padding:10px 20px;
                         font-size:12px;
                         font-weight:600;
                         border-radius:20px;
                       ">
                      Download Now
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ========== FOOTER WITH SOCIAL ICONS ========== -->
          <tr>
            <td style="background:#f3f4f6; padding:30px 35px; text-align:center;">
              
              <!-- Social Icons -->
              <div style="margin-bottom:20px;">
                <a href="https://instagram.com/brandmonkacademy" style="display:inline-block; margin:0 8px; text-decoration:none;">
                  <div style="width:36px; height:36px; border:1px solid #9ca3af; border-radius:50%; line-height:36px; text-align:center;">
                    <span style="color:#6b7280; font-size:16px;">�</span>
                  </div>
                </a>
                <a href="https://twitter.com/brandmonk" style="display:inline-block; margin:0 8px; text-decoration:none;">
                  <div style="width:36px; height:36px; border:1px solid #9ca3af; border-radius:50%; line-height:36px; text-align:center;">
                    <span style="color:#6b7280; font-size:16px;">�</span>
                  </div>
                </a>
                <a href="https://brandmonkacademy.com" style="display:inline-block; margin:0 8px; text-decoration:none;">
                  <div style="width:36px; height:36px; border:1px solid #9ca3af; border-radius:50%; line-height:36px; text-align:center;">
                    <span style="color:#6b7280; font-size:16px;">🌐</span>
                  </div>
                </a>
              </div>
              
              <p style="margin:0 0 10px; font-size:11px; color:#9ca3af; line-height:1.6; max-width:400px; margin-left:auto; margin-right:auto;">
                You are receiving this email because you completed a program at Brand Monk Academy. Make sure our messages get to your inbox.
              </p>
              
              <p style="margin:0; font-size:10px; color:#9ca3af;">
                © ${new Date().getFullYear()} Brand Monk Academy. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
      `
    });

    if (error) {
      console.error("Resend Error:", error);
      return res.status(500).json({ 
        success: false, 
        message: `Email error: ${error.message}` 
      });
    }

    console.log("Email sent successfully to:", student.email, "ID:", emailData?.id);

    // Update certificate sent status
    try {
      if (studentId.match(/^[0-9a-fA-F]{24}$/)) {
        await Student.findByIdAndUpdate(studentId, {
          certificateSent: true,
          certificateSentAt: new Date()
        });
      }
    } catch (e) {
      console.error("MongoDB Update Sent Error:", e.message);
    }

    // Update in file as well
    const data = readData();
    const index = data.findIndex(s => s._id === studentId || s._id.toString() === studentId);
    if (index !== -1) {
      data[index].certificateSent = true;
      data[index].certificateSentAt = new Date();
      writeData(data);
    }

    res.json({
      success: true,
      message: `Certificate email sent to ${student.email}`
    });
  } catch (error) {
    console.error("SendCertificateEmail Error:", error);
    
    let errorMessage = 'Failed to send email.';
    if (error.message) {
      errorMessage = `Email error: ${error.message}`;
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage
    });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    // let students = []; // Removed to avoid redeclaration
    
    let mongoStudents = [];
    let fileStudents = [];
    
    // Try MongoDB first
    try {
      mongoStudents = await Student.find({}).sort({ createdAt: -1 });
      mongoStudents = mongoStudents.map(s => ({
        ...s._doc,
        _id: s._id.toString()
      }));
    } catch (e) {
      console.error("MongoDB Stats Error:", e.message);
    }

    // Also read from file
    fileStudents = readData();

    // Merge both sources (dedup by email)
    const studentMap = new Map();
    const getKey = (s) => `${(s.email || '').toLowerCase()}_${(s.webinarName || '').toLowerCase()}`;
    
    [...mongoStudents, ...fileStudents].forEach(s => {
      const key = getKey(s);
      if (!studentMap.has(key)) {
        studentMap.set(key, s);
      }
    });

    const students = Array.from(studentMap.values());

    const stats = {
      totalStudents: students.length,
      eligibleStudents: students.filter(s => s.isEligible).length,
      certificatesSent: students.filter(s => s.certificateSent).length,
      professionBreakdown: {},
      locationBreakdown: {},
      webinarBreakdown: {},
      monthlyRegistrations: [], // For charts
      topWebinars: [] // For top courses list
    };

    // Helper for months
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const last6Months = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      last6Months[key] = 0;
    }

    students.forEach(s => {
      // Profession breakdown
      stats.professionBreakdown[s.profession] = (stats.professionBreakdown[s.profession] || 0) + 1;
      // Location breakdown
      stats.locationBreakdown[s.location] = (stats.locationBreakdown[s.location] || 0) + 1;
      // Webinar breakdown
      const wName = s.webinarName || 'Unknown';
      stats.webinarBreakdown[wName] = (stats.webinarBreakdown[wName] || 0) + 1;

      // Monthly Stats
      let regDate = new Date(s.dateOfRegistration || s.createdAt);
      if (isNaN(regDate.getTime())) {
        regDate = new Date(); // Fallback to now for chart if invalid
      }
      
      const key = `${monthNames[regDate.getMonth()]} ${regDate.getFullYear()}`;
      if (last6Months.hasOwnProperty(key)) {
        last6Months[key]++;
      }
    });

    // Format monthly data for Recharts
    stats.monthlyRegistrations = Object.entries(last6Months).map(([name, count]) => ({
      name,
      registrations: count
    }));

    // Format top webinars
    stats.topWebinars = Object.entries(stats.webinarBreakdown)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("GetStats Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch stats' 
    });
  }
};

module.exports = { 
  adminLogin, 
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent, 
  toggleEligibility, 
  sendCertificateEmail,
  getDashboardStats
};

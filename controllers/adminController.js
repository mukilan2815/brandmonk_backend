const Student = require('../models/Student');
const Admin = require('../models/Admin');
const nodemailer = require('nodemailer');
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

  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Email not configured! Set EMAIL_USER and EMAIL_PASS in .env");
    return res.status(500).json({
      success: false,
      message: 'Email not configured. Please set EMAIL_USER and EMAIL_PASS in .env file. Use Gmail App Password for EMAIL_PASS.'
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
    console.log("Using email account:", process.env.EMAIL_USER);

    // Handle undefined values with fallbacks
    const webinarName = student.webinarName || 'Brand Monk Academy Program';
    const certificateId = student.certificateId || `BMA-${Date.now()}`;
    const studentName = student.name || 'Participant';
    
    // Determine program type (Course vs Webinar)
    // You might need to fetch the webinar details if 'type' isn't stored on student
    // For now, let's assume if it's not explicitly a webinar, we check the name or default
    const programType = (student.webinarName && student.webinarName.toLowerCase().includes('course')) ? 'Course' : 'Webinar';
    // Ideally, we should fetch the webinar object to overlap with the schema 'type', but this is a quick heuristic if 'type' isn't on student.
    // If you added 'type' to Student schema, use student.type || ...

    const issueDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Create certificate download link
    const certificateUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificate/${student._id}`;
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${student._id}`;

    const mailOptions = {
      from: `"Brand Monk Academy" <${process.env.EMAIL_USER}>`,
      to: student.email,
      subject: `Your ${programType} Certificate is Ready - ${webinarName} | Brand Monk Academy`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="margin:0; padding:0; background:#f7f7f7; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr>
      <td align="center">
        
        <!-- Outer Container -->
        <table width="620" cellpadding="0" cellspacing="0" 
               style="background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 3px 14px rgba(0,0,0,0.08);">

          <!-- Banner Section -->
          <tr>
            <td style="padding:0;">
              <div style="position:relative;">
                <img src="https://brandmonkacademy.com/wp-content/uploads/2023/09/cropped-BMA-Logo-01-01-768x228-1.png"
                     alt="Brand Monk Academy" 
                     style="width:180px; margin:25px auto; display:block;">
              </div>
            </td>
          </tr>

          <!-- Hero Editorial Block -->
          <tr>
            <td style="padding:45px 40px 35px; background:#f1f5f9;">
              <table width="100%">
                <tr>
                  <td width="60%" style="vertical-align:top;">
                    <h1 style="margin:0; font-size:26px; color:#111827; font-weight:700; line-height:1.3;">
                      Your Certificate Is Ready
                    </h1>
                    <p style="margin-top:12px; font-size:15px; color:#6b7280; line-height:1.7;">
                      Congratulations on completing the ${programType.toLowerCase()}. You can now download your official certificate.
                    </p>
                  </td>

                  <td width="40%" style="text-align:right;">
                    <div style="
                      width:110px; 
                      height:110px; 
                      background:#0ea5e9; 
                      border-radius:8px; 
                      display:flex; 
                      align-items:center; 
                      justify-content:center;
                      margin-left:auto;
                    ">
                      <span style="font-size:50px; color:#fff;">&#127942;</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Letter Body -->
          <tr>
            <td style="padding:40px 40px 10px;">
              <p style="margin:0; font-size:16px; color:#374151; line-height:1.7;">
                Dear <strong>${studentName}</strong>,
              </p>

              <p style="margin-top:18px; font-size:15px; color:#6b7280; line-height:1.8;">
                Thank you for participating in our ${programType.toLowerCase()}. Your dedication toward learning is truly appreciated.
                Your certificate is now available for download.
              </p>
            </td>
          </tr>

          <!-- Editorial Certificate Info Block -->
          <tr>
            <td style="padding:0 40px 35px;">
              <div style="
                background:#e2e8f0; 
                padding:25px 22px; 
                border-radius:10px;
              ">
                <p style="margin:0 0 8px; font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:1px;">
                  Program Attended
                </p>
                <h3 style="margin:0 0 18px; color:#1e293b; font-size:20px; font-weight:700;">
                  ${webinarName}
                </h3>

                <table width="100%">
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="font-size:12px; color:#64748b;">Certificate ID</span><br>
                      <strong style="font-size:14px; color:#1f2937; font-family:monospace;">${certificateId}</strong>
                    </td>
                    <td style="padding:6px 0;">
                      <span style="font-size:12px; color:#64748b;">Issue Date</span><br>
                      <strong style="font-size:14px; color:#1f2937;">${issueDate}</strong>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td style="padding:0 40px 30px;" align="center">
              <a href="${certificateUrl}" 
                 style="
                   background:#0ea5e9; 
                   color:#fff; 
                   text-decoration:none; 
                   padding:15px 40px; 
                   font-size:15px; 
                   border-radius:8px; 
                   font-weight:600;
                   display:inline-block;
                 ">
                 Download Certificate
              </a>

              <p style="margin-top:18px; font-size:12px; color:#64748b;">
                Verify: <a href="${verifyUrl}" style="color:#0ea5e9;">${verifyUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Soft Editorial Footer -->
          <tr>
            <td style="background:#111827; padding:35px 40px;" align="center">
              <p style="margin:0; font-size:14px; color:#fff; font-weight:600;">
                Brand Monk Academy
              </p>
              <p style="margin:8px 0 0; font-size:12px; color:#94a3b8;">
                Empowering minds. Shaping futures.
              </p>
              <p style="margin-top:15px; font-size:11px; color:#6b7280;">
                © ${new Date().getFullYear()} Brand Monk Academy
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
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", student.email);

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
    
    // Provide helpful error messages
    let errorMessage = 'Failed to send email.';
    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed. Make sure you are using a Gmail App Password (not your regular password). Go to Google Account > Security > 2-Step Verification > App passwords.';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Network error. Check your internet connection.';
    } else if (error.message) {
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

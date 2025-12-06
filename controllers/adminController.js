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
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);">
                  
                  <!-- Logo Header -->
                  <tr>
                    <td style="background-color: #ffffff; padding: 35px 40px; text-align: center; border-bottom: 1px solid #eee;">
                      <a href="https://brandmonkacademy.com" style="text-decoration: none;">
                        <img src="https://brandmonkacademy.com/wp-content/uploads/2023/09/cropped-BMA-Logo-01-01-768x228-1.png" alt="Brand Monk Academy" style="height: 70px; max-width: 280px;">
                      </a>
                    </td>
                  </tr>
                  
                  <!-- Hero Section -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 50px 40px; text-align: center;">
                      <div style="width: 90px; height: 90px; background-color: #10b981; border-radius: 50%; margin: 0 auto 25px; line-height: 90px;">
                        <span style="font-size: 45px; color: #ffffff;">&#127942;</span>
                      </div>
                      <h1 style="color: #ffffff; margin: 0 0 12px 0; font-size: 28px; font-weight: 700;">
                        Your Certificate is Ready!
                      </h1>
                      <p style="color: #94a3b8; margin: 0; font-size: 16px;">
                         Congratulations on completing the ${programType.toLowerCase()}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content Section -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="font-size: 16px; color: #374151; margin: 0 0 25px 0; line-height: 1.7;">
                        Dear <strong>${studentName}</strong>,
                      </p>
                      
                      <p style="font-size: 15px; color: #6b7280; line-height: 1.8; margin: 0 0 30px 0;">
                        Congratulations on successfully attending our ${programType.toLowerCase()}! Your dedication to continuous learning is commendable. Your Certificate of Participation is now ready for download.
                      </p>
                      
                      <!-- Webinar Details Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
                        <tr>
                          <td style="padding: 25px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 8px 0;">
                                  <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">${programType} Attended</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 0 0 15px 0; border-bottom: 1px solid #e2e8f0;">
                                  <strong style="color: #1f2937; font-size: 20px;">${webinarName}</strong>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding-top: 15px;">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td width="50%" style="vertical-align: top;">
                                        <span style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Certificate ID</span><br>
                                        <strong style="color: #374151; font-size: 13px; font-family: monospace;">${certificateId}</strong>
                                      </td>
                                      <td width="50%" style="vertical-align: top;">
                                        <span style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Issue Date</span><br>
                                        <strong style="color: #374151; font-size: 13px;">${issueDate}</strong>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Download Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${certificateUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
                              Download Certificate (PDF)
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Verify Link -->
                      <p style="font-size: 12px; color: #9ca3af; margin: 30px 0 0 0; text-align: center;">
                        Verify certificate: <a href="${verifyUrl}" style="color: #10b981;">${verifyUrl}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Explore Section -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align: center;">
                            <p style="margin: 0 0 15px 0; font-size: 15px; color: #374151; font-weight: 600;">
                              Continue Your Learning Journey
                            </p>
                            <p style="margin: 0 0 20px 0; font-size: 13px; color: #6b7280;">
                              Explore more webinars and courses at Brand Monk Academy
                            </p>
                            <a href="https://brandmonkacademy.com" style="display: inline-block; background-color: #1f2937; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                              Visit Our Website
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 30px 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align: center;">
                            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #ffffff;">
                              Brand Monk Academy
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 12px; color: #94a3b8;">
                              Empowering minds, Transforming futures
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #6b7280;">
                              © ${new Date().getFullYear()} Brand Monk Academy. All rights reserved.
                            </p>
                          </td>
                        </tr>
                      </table>
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

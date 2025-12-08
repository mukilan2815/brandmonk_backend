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
      from: 'Brand Monk Academy <onboarding@resend.dev>',
      to: [student.email],
      subject: `🎉 Congratulations! Your ${programType} Certificate is Ready | Brand Monk Academy`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>

<body style="margin:0; padding:0; background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); font-family:'Inter', 'Segoe UI', Arial, sans-serif;">
  
  <!-- Confetti decoration -->
  <div style="position:absolute; width:100%; height:200px; overflow:hidden; pointer-events:none;">
    <div style="position:absolute; top:20px; left:10%; font-size:24px;">🎊</div>
    <div style="position:absolute; top:40px; left:25%; font-size:18px;">✨</div>
    <div style="position:absolute; top:15px; left:45%; font-size:20px;">🌟</div>
    <div style="position:absolute; top:35px; left:65%; font-size:22px;">🎉</div>
    <div style="position:absolute; top:25px; left:85%; font-size:18px;">⭐</div>
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.4);">

          <!-- Premium Gradient Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); padding:40px 40px 50px; text-align:center; position:relative;">
              
              <!-- Logo -->
              <img src="https://brandmonkacademy.com/wp-content/uploads/2023/09/cropped-BMA-Logo-01-01-768x228-1.png"
                   alt="Brand Monk Academy" 
                   style="width:160px; margin-bottom:25px; filter: brightness(0) invert(1);">
              
              <!-- Celebration Badge -->
              <div style="margin:0 auto 20px; width:100px; height:100px; background:linear-gradient(145deg, #ffd700, #ffb347, #ffd700); border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 30px rgba(255,215,0,0.4);">
                <span style="font-size:50px;">🏆</span>
              </div>
              
              <!-- Main Title -->
              <h1 style="margin:0; font-family:'Playfair Display', Georgia, serif; font-size:32px; color:#ffffff; font-weight:700; letter-spacing:-0.5px; text-shadow:0 2px 10px rgba(0,0,0,0.2);">
                Congratulations!
              </h1>
              <p style="margin:12px 0 0; font-size:16px; color:rgba(255,255,255,0.9); font-weight:500;">
                Your achievement is now certified
              </p>
            </td>
          </tr>

          <!-- Personal Greeting -->
          <tr>
            <td style="padding:45px 45px 25px; text-align:center;">
              <p style="margin:0; font-size:18px; color:#374151; line-height:1.6;">
                Dear <strong style="color:#6366f1; font-weight:700;">${studentName}</strong>,
              </p>
              <p style="margin:15px 0 0; font-size:15px; color:#6b7280; line-height:1.8; max-width:450px; margin-left:auto; margin-right:auto;">
                We are thrilled to recognize your dedication and successful completion of the ${programType.toLowerCase()}. Your commitment to learning is truly inspiring!
              </p>
            </td>
          </tr>

          <!-- Certificate Card with Gradient Border -->
          <tr>
            <td style="padding:0 35px 35px;">
              <div style="background:linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7); padding:3px; border-radius:20px;">
                <div style="background:#fefefe; border-radius:18px; padding:30px; text-align:center;">
                  
                  <!-- Program Label -->
                  <div style="display:inline-block; background:linear-gradient(135deg, #fef3c7, #fde68a); padding:6px 16px; border-radius:20px; margin-bottom:15px;">
                    <span style="font-size:11px; color:#92400e; font-weight:600; text-transform:uppercase; letter-spacing:1.5px;">
                      ${programType} Completed
                    </span>
                  </div>
                  
                  <!-- Program Name -->
                  <h2 style="margin:0 0 25px; font-family:'Playfair Display', Georgia, serif; font-size:24px; color:#1e1b4b; font-weight:700; line-height:1.3;">
                    ${webinarName}
                  </h2>
                  
                  <!-- Certificate Details -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; border-radius:12px; overflow:hidden;">
                    <tr>
                      <td style="padding:20px; border-bottom:1px solid #e2e8f0;" width="50%">
                        <p style="margin:0 0 5px; font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Certificate ID</p>
                        <p style="margin:0; font-size:14px; color:#1e293b; font-family:'Courier New', monospace; font-weight:700; background:linear-gradient(90deg, #6366f1, #8b5cf6); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
                          ${certificateId}
                        </p>
                      </td>
                      <td style="padding:20px; border-bottom:1px solid #e2e8f0; border-left:1px solid #e2e8f0;" width="50%">
                        <p style="margin:0 0 5px; font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Issue Date</p>
                        <p style="margin:0; font-size:14px; color:#1e293b; font-weight:600;">
                          ${issueDate}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding:20px; text-align:center;">
                        <p style="margin:0 0 5px; font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Issued By</p>
                        <p style="margin:0; font-size:14px; color:#1e293b; font-weight:600;">Brand Monk Academy</p>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 45px 20px;" align="center">
              <a href="${certificateUrl}" 
                 style="
                   background:linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
                   color:#fff; 
                   text-decoration:none; 
                   padding:18px 50px; 
                   font-size:16px; 
                   border-radius:50px; 
                   font-weight:700;
                   display:inline-block;
                   box-shadow:0 10px 25px -5px rgba(99, 102, 241, 0.5);
                   letter-spacing:0.5px;
                 ">
                 ⬇️ Download Your Certificate
              </a>
            </td>
          </tr>
          
          <!-- Verify Link -->
          <tr>
            <td style="padding:0 45px 35px;" align="center">
              <p style="margin:0; font-size:13px; color:#94a3b8;">
                Verify authenticity: 
                <a href="${verifyUrl}" style="color:#6366f1; text-decoration:none; font-weight:500;">${verifyUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Social Proof / What's Next -->
          <tr>
            <td style="padding:0 45px 35px;">
              <div style="background:#f0fdf4; border-left:4px solid #22c55e; padding:20px 25px; border-radius:0 12px 12px 0;">
                <p style="margin:0 0 8px; font-size:14px; color:#166534; font-weight:600;">🚀 What's Next?</p>
                <p style="margin:0; font-size:13px; color:#4ade80; line-height:1.6;">
                  Share your achievement on LinkedIn and tag us! Keep learning and growing with more courses from Brand Monk Academy.
                </p>
              </div>
            </td>
          </tr>

          <!-- Premium Dark Footer -->
          <tr>
            <td style="background:linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding:40px 45px;" align="center">
              
              <!-- Footer Logo -->
              <img src="https://brandmonkacademy.com/wp-content/uploads/2023/09/cropped-BMA-Logo-01-01-768x228-1.png"
                   alt="Brand Monk Academy" 
                   style="width:120px; margin-bottom:20px; opacity:0.9; filter: brightness(0) invert(1);">
              
              <p style="margin:0 0 8px; font-size:13px; color:rgba(255,255,255,0.7); font-weight:500;">
                Empowering Minds. Shaping Futures.
              </p>
              
              <!-- Social Icons Placeholder -->
              <div style="margin:20px 0;">
                <a href="#" style="display:inline-block; margin:0 8px; width:36px; height:36px; background:rgba(255,255,255,0.1); border-radius:50%; line-height:36px; text-align:center; text-decoration:none;">
                  <span style="color:#fff; font-size:16px;">📸</span>
                </a>
                <a href="#" style="display:inline-block; margin:0 8px; width:36px; height:36px; background:rgba(255,255,255,0.1); border-radius:50%; line-height:36px; text-align:center; text-decoration:none;">
                  <span style="color:#fff; font-size:16px;">💼</span>
                </a>
                <a href="#" style="display:inline-block; margin:0 8px; width:36px; height:36px; background:rgba(255,255,255,0.1); border-radius:50%; line-height:36px; text-align:center; text-decoration:none;">
                  <span style="color:#fff; font-size:16px;">🌐</span>
                </a>
              </div>
              
              <p style="margin:0; font-size:11px; color:rgba(255,255,255,0.4);">
                © ${new Date().getFullYear()} Brand Monk Academy. All rights reserved.
              </p>
              <p style="margin:8px 0 0; font-size:10px; color:rgba(255,255,255,0.3);">
                This email was sent to ${student.email}
              </p>
            </td>
          </tr>

        </table>
        
        <!-- Bottom Tagline -->
        <p style="margin:30px 0 0; font-size:12px; color:rgba(255,255,255,0.5); text-align:center;">
          Made with ❤️ by Brand Monk Academy
        </p>

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

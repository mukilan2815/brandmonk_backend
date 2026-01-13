const Student = require('../models/Student');
const Admin = require('../models/Admin');
const { Resend } = require('resend');
const { 
  backupStudent, 
  deleteStudentBackup, 
  backupStudentsBatch,
  logBackupEvent 
} = require('../services/firebaseBackup');

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

  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username and password are required' 
    });
  }

  const admin = ADMIN_CREDENTIALS[username];
  
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
    const students = await Student.find({}).sort({ createdAt: -1 });
    
    // Filter out duplicates: same email + same course/webinar should only appear once
    // Using a Map to track unique email+course combinations
    const uniqueMap = new Map();
    const uniqueStudents = [];
    const duplicates = [];
    
    for (const student of students) {
      if (!student) continue;

      // Create a unique key using email + webinar occurrence identifier.
      // Prefer webinarSlug (supports same webinar name across different dates).
      const email = (student.email || '').toLowerCase().trim();
      
      // Skip if critical data is missing
      if (!email && !student.name) continue;

      const webinarSlug = (student.webinarSlug || '').toLowerCase().trim();
      const webinarId = student.webinarId ? String(student.webinarId) : '';
      const courseName = (student.webinarName || '').toLowerCase().trim();
      const uniqueProgramKey = webinarSlug || webinarId || courseName || 'unknown-program';
      const uniqueKey = `${email}|${uniqueProgramKey}`;
      
      // Only keep the first occurrence (which is the most recent due to sorting)
      if (!uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, true);
        uniqueStudents.push({
          ...student._doc,
          _id: student._id.toString()
        });
      } else {
        // Track duplicates
        duplicates.push({
          name: student.name || 'Unknown',
          email: student.email || 'no-email',
          course: student.webinarName || 'Unknown',
          registeredAt: student.createdAt || new Date()
        });
      }
    }

    // Log duplicates summary (not individual entries to avoid log spam)
    if (duplicates.length > 0) {
      console.log(`� Students: ${uniqueStudents.length} unique | ${duplicates.length} duplicates filtered`);
    }

    res.json({
      success: true,
      count: uniqueStudents.length,
      students: uniqueStudents,
      duplicates: duplicates, // Send duplicates to frontend
      totalInDB: students.length
    });
  } catch (error) {
    console.error("Critical GetAllStudents Error:", error);
    // Return empty list instead of crashing client
    res.status(200).json({ 
      success: false, 
      message: 'Partial load due to error',
      students: [],
      error: error.message
    });
  }
};

// @desc    Create a new student (Admin manually adds)
// @route   POST /api/admin/students
// @access  Private (Admin only - Chennai can add)
const createStudent = async (req, res) => {
  console.log("Admin Create Student Request Recieved");
  console.log("Body:", req.body);
  const { name, email, phone, webinarName, location, profession } = req.body;

  if (!name || !email || !phone || !webinarName || !location || !profession) {
    console.log("Validation failed: Missing fields");
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  // Check for duplicate student
  try {
    const existingStudent = await Student.findOne({ email: email.trim().toLowerCase() });
    if (existingStudent) {
      console.log("Duplicate email found:", email);
      return res.status(400).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }
  } catch (err) {
    console.error("Error checking duplicate email:", err);
    return res.status(500).json({ success: false, message: 'Database error checking duplicates' });
  }

  // Determine certificate type based on input or default to Standard
  const validCertificateType = ['Standard', 'Government'].includes(req.body.certificateType) 
    ? req.body.certificateType 
    : 'Standard';

  try {
    console.log("Starting Certificate ID generation...");
    // Generate Certificate ID manually in controller
    let certificateId = '';
    
    // Find the highest numeric certificate ID using aggregation (string sort doesn't work for numbers)
    const maxIdResult = await Student.aggregate([
      { $match: { certificateId: { $regex: /^SMAPARMQ076\d+$/ } } },
      { 
        $project: { 
          numericId: { 
            $toInt: { $substr: ['$certificateId', 10, -1] } // Extract number after "SMAPARMQ076"
          } 
        } 
      },
      { $sort: { numericId: -1 } },
      { $limit: 1 }
    ]);

    let nextNum = 1;
    if (maxIdResult.length > 0 && maxIdResult[0].numericId) {
      nextNum = maxIdResult[0].numericId + 1;
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
        console.log("Unique ID found:", certificateId);
      } else {
        console.log("Collision for ID:", potentialId, "Retrying...");
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
      webinarName: webinarName.trim(),
      location: location.trim(),
      profession,
      certificateId, // Explicitly set the generated ID
      isEligible: false,
      hasFollowedInstagram: false,
      certificateSent: false,
      dateOfRegistration: new Date(),
      certificateType: validCertificateType
    };

    console.log("Attempting to save student data:", studentData);

    const student = new Student(studentData);
    const savedStudent = await student.save();
    
    console.log("Student saved successfully:", savedStudent._id);

    // Backup to Firebase (fire-and-forget)
    backupStudent(savedStudent).catch(err => console.error('Firebase backup error:', err.message));

    res.status(201).json({
      success: true,
      message: 'Student added successfully!',
      student: savedStudent
    });
  } catch (error) {
    console.error("CRITICAL CreateStudent Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to add student',
      error: error.message,
      stack: error.stack // Include stack for debugging
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
    const updateData = {
      ...(name && { name: name.trim() }),
      ...(email && { email: email.trim().toLowerCase() }),
      ...(phone && { phone: phone.trim() }),
      ...(webinarName && { webinarName: webinarName.trim() }),
      ...(location && { location: location.trim() }),
      ...(profession && { profession }),
      ...(req.body.certificateType && { certificateType: req.body.certificateType })
    };

    const student = await Student.findByIdAndUpdate(studentId, updateData, { new: true });

    if (student) {
      // Backup updated student to Firebase (fire-and-forget)
      backupStudent(student).catch(err => console.error('Firebase backup error:', err.message));
      
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
    const result = await Student.findByIdAndDelete(studentId);

    if (result) {
      // Log deletion event to Firebase but DON'T delete the backup (fire-and-forget)
      // This keeps historical data even if deleted from MongoDB
      logBackupEvent('STUDENT_DELETED_FROM_MONGO', {
        studentId,
        name: result.name,
        email: result.email,
        deletedAt: new Date().toISOString()
      }).catch(err => console.error('Firebase log error:', err.message));
      console.log(`\ud83d\udccb Student ${studentId} deleted from MongoDB, backup preserved in Firebase`);
      
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
    const updateData = { 
      isEligible,
      ...(isEligible === false && { certificateSent: false, certificateSentAt: null })
    };

    const student = await Student.findByIdAndUpdate(studentId, updateData, { new: true });

    if (student) {
      // Backup updated student to Firebase (fire-and-forget)
      backupStudent(student).catch(err => console.error('Firebase backup error:', err.message));
      
      res.json({
        success: true,
        message: `Certificate eligibility ${isEligible ? 'approved' : 'revoked'}`,
        student
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

  if (!process.env.RESEND_API_KEY) {
    console.error("Resend not configured! Set RESEND_API_KEY in .env");
    return res.status(500).json({
      success: false,
      message: 'Email service not configured. Please set RESEND_API_KEY in environment variables.'
    });
  }

  try {
    const student = await Student.findById(studentId);

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

    const RESEND_TEST_EMAIL = process.env.RESEND_TEST_EMAIL || 'mukilan2808@gmail.com';
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    if (FROM_EMAIL.includes('resend.dev') && student.email.toLowerCase() !== RESEND_TEST_EMAIL.toLowerCase()) {
      console.warn("⚠️ Resend Test Mode: Can only send to", RESEND_TEST_EMAIL);
      return res.status(400).json({ 
        success: false, 
        message: `⚠️ Resend Test Mode Active! You can only send test emails to ${RESEND_TEST_EMAIL}. To send emails to other recipients:\n\n1. Go to resend.com/domains\n2. Verify your domain (e.g., brandmonkacademy.com)\n3. Add RESEND_FROM_EMAIL=hello@yourdomain.com to your .env file`
      });
    }

    const webinarName = student.webinarName || 'Brand Monk Academy Program';
    const certificateId = student.certificateId || `BMA-${Date.now()}`;
    const studentName = student.name || 'Participant';
    const programType = (student.webinarName && student.webinarName.toLowerCase().includes('course')) ? 'Course' : 'Webinar';

    const issueDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const certificateUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificate/${student._id}`;
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${student._id}`;

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
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:0; overflow:hidden;">
          <tr>
            <td style="background:#ffffff; padding:20px 30px; border-bottom:1px solid #eee;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="width:50%;">
                    <img src="https://brandmonkacademy.com/wp-content/uploads/2023/09/cropped-BMA-Logo-01-01-768x228-1.png" alt="Brand Monk Academy" style="height:80px; width:auto;">
                  </td>
                  <td align="right" style="width:50%; font-size:13px; color:#666;">
                    ${issueDate}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%); padding:40px 35px; text-align:center;">
              <h1 style="margin:0 0 15px; font-size:28px; color:#ffffff; font-weight:700; letter-spacing:-0.5px;">
                🎉 Certificate of Completion
              </h1>
              <p style="margin:0 0 25px; font-size:14px; color:rgba(255,255,255,0.9); line-height:1.7; max-width:480px; margin-left:auto; margin-right:auto;">
                Congratulations <strong>${studentName}</strong>! You have successfully completed the <strong>${webinarName}</strong> ${programType.toLowerCase()}. Your dedication to learning and growth is truly commendable.
              </p>
              <a href="${certificateUrl}" style="display:inline-block; background:#fbbf24; color:#1f2937; text-decoration:none; padding:14px 35px; font-size:14px; font-weight:600; border-radius:30px; box-shadow:0 4px 15px rgba(251,191,36,0.4);">
                Download Certificate
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:#fef9c3; padding:35px;">
              <h2 style="margin:0 0 12px; font-size:20px; color:#1f2937; font-weight:700;">Your Achievement</h2>
              <p style="margin:0 0 8px; font-size:13px; color:#1f2937; font-weight:600;">
                Certificate ID: <span style="color:#0d9488;">${certificateId}</span>
              </p>
              <p style="margin:0 0 20px; font-size:13px; color:#6b7280; line-height:1.6;">
                This certificate validates your successful completion of the program conducted by Brand Monk Academy.
              </p>
              <a href="${verifyUrl}" style="display:inline-block; background:#10b981; color:#ffffff; text-decoration:none; padding:12px 28px; font-size:13px; font-weight:600; border-radius:25px;">
                Verify Certificate
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:#f3f4f6; padding:30px 35px; text-align:center;">
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

    const updatedStudent = await Student.findByIdAndUpdate(studentId, {
      certificateSent: true,
      certificateSentAt: new Date()
    }, { new: true });

    // Backup updated student to Firebase (fire-and-forget)
    if (updatedStudent) {
      backupStudent(updatedStudent).catch(err => console.error('Firebase backup error:', err.message));
    }

    res.json({
      success: true,
      message: `Certificate email sent to ${student.email}`
    });
  } catch (error) {
    console.error("SendCertificateEmail Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email.' 
    });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    const students = await Student.find({});

    const stats = {
      totalStudents: students.length,
      eligibleStudents: 0,
      certificatesSent: 0,
      professionBreakdown: {},
      locationBreakdown: {},
      webinarBreakdown: {},
      monthlyRegistrations: [],
      topWebinars: []
    };

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const last6Months = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      last6Months[key] = 0;
    }

    students.forEach(s => {
      if (!s) return;

      if (s.isEligible) stats.eligibleStudents++;
      if (s.certificateSent) stats.certificatesSent++;

      const prof = s.profession || 'Other';
      stats.professionBreakdown[prof] = (stats.professionBreakdown[prof] || 0) + 1;

      const loc = s.location || 'Unknown';
      stats.locationBreakdown[loc] = (stats.locationBreakdown[loc] || 0) + 1;

      const wName = s.webinarName || 'Unknown';
      stats.webinarBreakdown[wName] = (stats.webinarBreakdown[wName] || 0) + 1;

      let regDate = new Date(s.dateOfRegistration || s.createdAt);
      if (isNaN(regDate.getTime())) {
        regDate = new Date();
      }
      
      const key = `${monthNames[regDate.getMonth()]} ${regDate.getFullYear()}`;
      if (last6Months.hasOwnProperty(key)) {
        last6Months[key]++;
      }
    });

    stats.monthlyRegistrations = Object.entries(last6Months).map(([name, count]) => ({
      name,
      registrations: count
    }));

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
    // Return empty stats safely
    res.status(200).json({ 
      success: false, 
      message: 'Failed to fetch stats',
      stats: {
        totalStudents: 0,
        eligibleStudents: 0,
        certificatesSent: 0,
        professionBreakdown: {},
        locationBreakdown: {},
        webinarBreakdown: {},
        monthlyRegistrations: [],
        topWebinars: []
      }
    });
  }
};

// @desc    Bulk import students from XLSX data
// @route   POST /api/admin/students/bulk-import
// @access  Private (Admin only)
const bulkImportStudents = async (req, res) => {
  console.log("Bulk Import Request received");
  const { students: importData } = req.body;

  if (!importData || !Array.isArray(importData) || importData.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid student data provided'
    });
  }

  console.log(`Processing ${importData.length} students for import`);

  try {
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    let currentCount = await Student.countDocuments();

    for (const row of importData) {
      try {
        const name = (row['Name'] || row['name'] || '').toString().trim();
        const email = (row['Email'] || row['email'] || '').toString().trim().toLowerCase();
        const phone = (row['Phone'] || row['phone'] || '').toString().trim();
        const webinarName = (row['Program Name'] || row['Program'] || row['webinarName'] || '').toString().trim();
        const webinarSlug = (row['webinarSlug'] || row['Webinar Slug'] || row['Slug'] || '').toString().trim();
        const location = (row['Location'] || row['location'] || '').toString().trim();
        const profession = (row['Profession'] || row['profession'] || 'Others').toString().trim();
        const collegeOrCompany = (row['College/Company'] || row['collegeOrCompany'] || '').toString().trim();
        const department = (row['Department'] || row['department'] || '').toString().trim();
        const yearOfStudyOrExperience = (row['Year/Experience'] || row['yearOfStudyOrExperience'] || '').toString().trim();
        // Note: Certificate ID from XLSX is ignored - we always generate unique IDs
        const instagramFollowed = (row['Instagram Followed'] || row['hasFollowedInstagram'] || '').toString().toLowerCase();
        const registrationDateStr = row['Registration Date'] || row['dateOfRegistration'] || '';

        if (!name || !email) {
          results.skipped++;
          results.errors.push(`Row skipped: Missing name or email`);
          continue;
        }

        const existingStudentQuery = webinarSlug
          ? { email, webinarSlug }
          : { email, webinarName };
        const existingStudent = await Student.findOne(existingStudentQuery);

        if (existingStudent) {
          results.skipped++;
          results.errors.push(`Duplicate: ${name} (${email}) already registered for ${webinarSlug || webinarName}`);
          continue;
        }

        // Always generate a unique certificate ID (ignore XLSX value to avoid duplicates)
        currentCount++;
        const certificateId = `SMAPARMQ076${currentCount.toString().padStart(3, '0')}`;

        let dateOfRegistration = new Date();
        if (registrationDateStr) {
          const parsedDate = new Date(registrationDateStr);
          if (!isNaN(parsedDate.getTime())) {
            dateOfRegistration = parsedDate;
          }
        }

        const validProfessions = ['Student', 'Entrepreneur', 'Working Professional', 'Home Maker', 'Freelance', 'Others'];
        const mappedProfession = validProfessions.find(p => 
          p.toLowerCase() === profession.toLowerCase()
        ) || 'Others';

        const studentData = {
          name,
          email,
          phone: phone || 'N/A',
          webinarName: webinarName || 'Imported Program',
          ...(webinarSlug ? { webinarSlug } : {}),
          location: location || 'N/A',
          profession: mappedProfession,
          collegeOrCompany,
          department,
          yearOfStudyOrExperience,
          certificateId,
          isEligible: false,
          hasFollowedInstagram: instagramFollowed === 'yes' || instagramFollowed === 'true',
          certificateSent: false,
          dateOfRegistration
        };

        const student = new Student(studentData);
        const savedStudent = await student.save();
        
        // Backup to Firebase (fire-and-forget)
        backupStudent(savedStudent).catch(err => console.error('Firebase backup error:', err.message));
        
        results.success++;

      } catch (rowError) {
        results.failed++;
        results.errors.push(`Error processing row: ${rowError.message}`);
      }
    }

    console.log(`Bulk import complete: ${results.success} success, ${results.failed} failed, ${results.skipped} skipped`);

    res.json({
      success: true,
      message: `Import complete: ${results.success} students added, ${results.skipped} skipped, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error("BulkImport Error:", error);
    res.status(500).json({
      success: false,
      message: 'Bulk import failed: ' + error.message
    });
  }
};

// @desc    Remove duplicate registrations
// @route   POST /api/admin/students/remove-duplicates
// @access  Private (Admin only)
const removeDuplicates = async (req, res) => {
  console.log("🧹 Starting duplicate removal process...");
  
  try {
    const students = await Student.find({}).sort({ createdAt: -1 });
    
    const uniqueMap = new Map();
    const toDelete = [];
    const duplicates = [];
    
    // Identify duplicates: same email + same webinar occurrence (slug preferred)
    for (const student of students) {
      const email = (student.email || '').toLowerCase().trim();
      const webinarSlug = (student.webinarSlug || '').toLowerCase().trim();
      const webinarId = student.webinarId ? String(student.webinarId) : '';
      const courseName = (student.webinarName || '').toLowerCase().trim();
      const uniqueProgramKey = webinarSlug || webinarId || courseName;
      const uniqueKey = `${email}|${uniqueProgramKey}`;
      
      if (!uniqueMap.has(uniqueKey)) {
        // Keep the first occurrence (most recent due to sorting)
        uniqueMap.set(uniqueKey, student._id);
      } else {
        // Mark for deletion
        toDelete.push(student._id);
        duplicates.push({
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          course: student.webinarName,
          registeredAt: student.createdAt
        });
      }
    }
    
    if (toDelete.length === 0) {
      return res.json({
        success: true,
        message: 'No duplicates found!',
        removed: 0,
        duplicates: []
      });
    }
    
    // Log what will be deleted
    console.log(`\n📋 Found ${toDelete.length} duplicate entries to remove:`);
    duplicates.forEach((dup, index) => {
      console.log(`${index + 1}. ${dup.name} (${dup.email}) - ${dup.course}`);
    });
    
    // Delete duplicates
    const deleteResult = await Student.deleteMany({ _id: { $in: toDelete } });
    
    console.log(`\n✅ Successfully removed ${deleteResult.deletedCount} duplicate entries`);
    console.log(`💾 Keeping ${uniqueMap.size} unique registrations\n`);
    
    res.json({
      success: true,
      message: `Removed ${deleteResult.deletedCount} duplicate registrations`,
      removed: deleteResult.deletedCount,
      duplicates: duplicates
    });
    
  } catch (error) {
    console.error("RemoveDuplicates Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove duplicates: ' + error.message
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
  getDashboardStats,
  bulkImportStudents,
  removeDuplicates
};

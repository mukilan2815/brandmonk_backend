const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');

const MONGO_URI = 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

async function addSriniranjan() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const studentName = 'J.Sriniranjan';

    // Check if already exists
    const existing = await CourseStudent.findOne({
      name: { $regex: /sriniranjan/i },
      courseSlug: 'digital-marketing'
    });

    if (existing) {
      console.log(`ℹ️  Student already exists: ${existing.name} (${existing.certificateId})`);
      console.log(`Verify URL: https://brand-monk.vercel.app/verify/course/${existing.certificateId}`);
      return;
    }

    // Find highest BMAFEBDMMES/Q0506S number
    const allDM = await CourseStudent.find({
      courseSlug: 'digital-marketing',
      certificateId: { $regex: /^BMAFEBDMMES\/Q0506S/ }
    });

    let maxNum = 0;
    allDM.forEach(s => {
      const match = s.certificateId.match(/Q0506S(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    const nextNum = maxNum + 1;
    const certId = `BMAFEBDMMES/Q0506S${String(nextNum).padStart(3, '0')}`;

    const newStudent = new CourseStudent({
      name: studentName,
      courseName: 'Digital Marketing',
      courseSlug: 'digital-marketing',
      certificateId: certId,
      isEligible: true,
      certificateSent: false,
      dateOfRegistration: new Date()
    });

    await newStudent.save();
    console.log(`✅ Added: ${studentName}`);
    console.log(`   Certificate ID : ${certId}`);
    console.log(`   Verify URL     : https://brand-monk.vercel.app/verify/course/${certId}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

addSriniranjan();

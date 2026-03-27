const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
const MONGO_URI = 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

async function addDyanesh() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const correctCertId = 'BMAJULDMMES/Q0706S378';

    const existing = await CourseStudent.findOne({
      $or: [
        { certificateId: correctCertId },
        { certificateId: 'BMAJULDMES/Q0706S378' },
        { name: { $regex: /dyanesh/i } }
      ]
    });

    if (existing) {
      // Fix the ID if it has the typo
      if (existing.certificateId !== correctCertId) {
        existing.certificateId = correctCertId;
        existing.name = 'DYANESH R';
        await existing.save();
        console.log(`✅ Fixed: ${existing.name} -> ${correctCertId}`);
      } else {
        console.log(`ℹ️  Already correct: ${existing.name} | ${existing.certificateId}`);
      }
    } else {
      const newStudent = new CourseStudent({
        name: 'DYANESH R',
        courseName: 'Digital Marketing',
        courseSlug: 'digital-marketing',
        certificateId: correctCertId,
        isEligible: true,
        certificateSent: false,
        dateOfRegistration: new Date()
      });
      await newStudent.save();
      console.log(`✅ Added: DYANESH R`);
    }

    console.log(`   Certificate ID : ${correctCertId}`);
    console.log(`   Verify URL     : https://brand-monk.vercel.app/verify/course/${correctCertId}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

addDyanesh();

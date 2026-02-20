const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');

const MONGO_URI = 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

async function addKavin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await CourseStudent.findOne({ 
      $or: [
        { certificateId: 'BMAJUNDMMES/Q0506S062' },
        { name: { $regex: /^kavin r$/i }, courseSlug: 'digital-marketing' }
      ]
    });

    if (existing) {
      console.log(`ℹ️  Student already exists: ${existing.name} (${existing.certificateId})`);
      // Make sure the ID and name are correct
      existing.name = 'Kavin R';
      existing.certificateId = 'BMAJUNDMMES/Q0506S062';
      existing.courseName = 'Digital Marketing';
      existing.courseSlug = 'digital-marketing';
      await existing.save();
      console.log('✅ Record updated!');
    } else {
      const newStudent = new CourseStudent({
        name: 'Kavin R',
        certificateId: 'BMAJUNDMMES/Q0506S062',
        courseName: 'Digital Marketing',
        courseSlug: 'digital-marketing',
        isEligible: true,
        certificateSent: false,
        dateOfRegistration: new Date('2026-02-20')
      });
      await newStudent.save();
      console.log('✅ Kavin R added successfully!');
      console.log(`   Certificate ID: BMAJUNDMMES/Q0506S062`);
      console.log(`   Verify URL: https://brand-monk.vercel.app/verify/course/BMAJUNDMMES/Q0506S062`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

addKavin();

const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');

const MONGO_URI = 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

// Both certificate IDs must resolve to this student
const STUDENT_NAME = 'MANOJKUMAR T';
const ENTRIES = [
  { certificateId: 'BMAJANDMMES/Q0406S208',  label: 'ID-1 (mapping variant)' },
  { certificateId: 'BMAJANDMMES/Q04065208', label: 'ID-2 (user-provided variant)' }
];

async function upsertEntry(certificateId, label) {
  const existing = await CourseStudent.findOne({ certificateId });

  if (existing) {
    // Update name/course fields in case they are stale
    existing.name = STUDENT_NAME;
    existing.courseName = 'Digital Marketing';
    existing.courseSlug = 'digital-marketing';
    existing.isEligible = true;
    await existing.save();
    console.log(`✅ ${label} — updated existing record (${certificateId})`);
  } else {
    const newStudent = new CourseStudent({
      name: STUDENT_NAME,
      certificateId,
      courseName: 'Digital Marketing',
      courseSlug: 'digital-marketing',
      isEligible: true,
      certificateSent: false,
      dateOfRegistration: new Date('2026-01-04')
    });
    await newStudent.save();
    console.log(`✅ ${label} — added new record (${certificateId})`);
  }
  console.log(`   Verify URL: https://brand-monk.vercel.app/verify/course/${certificateId}`);
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    for (const entry of ENTRIES) {
      await upsertEntry(entry.certificateId, entry.label);
      console.log('');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

main();

const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
require('dotenv').config();

// Video Editing Students to add
const veStudents = [
  'Omprakash S',
  'Badmavathi B',
  'R.M.Deepika',
  'Karthi R',
  'Ashaz Ahmed R',
  'Saran.A',
  'Marimuthu P',
  'nivya',
  'jayaraj'
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected\n');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const addVEStudents = async () => {
  await connectDB();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Adding Video Editing Students');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get existing Video Editing students
  const existingVE = await CourseStudent.find({ courseSlug: 'video-editing' });
  const existingNames = new Set(existingVE.map(s => s.name.toLowerCase().trim()));

  // Find the highest certificate number in BMAJUNDMMES format
  const existing = await CourseStudent.find({ 
    certificateId: { $regex: '^BMAJUNDMMES' } 
  }).sort({ certificateId: -1 }).limit(1);

  let maxNum = 53; // Default starting point
  if (existing.length > 0) {
    const lastId = existing[0].certificateId;
    const match = lastId.match(/BMAJUNDMMES\/Q0506S(\d+)/);
    if (match) {
      maxNum = parseInt(match[1]);
    }
  }

  console.log(`Current highest certificate number: BMAJUNDMMES/Q0506S${String(maxNum).padStart(3, '0')}`);
  console.log(`Total existing VE students: ${existingVE.length}\n`);

  let inserted = 0;
  let skipped = 0;
  let currentNum = maxNum;
  const addedStudents = [];

  for (const name of veStudents) {
    const normalizedName = name.toLowerCase().trim();

    // Check if already exists
    if (existingNames.has(normalizedName)) {
      console.log(`⏭️ Already exists: ${name}`);
      skipped++;
      continue;
    }

    currentNum++;
    const certId = `BMAJUNDMMES/Q0506S${String(currentNum).padStart(3, '0')}`;

    try {
      const student = new CourseStudent({
        name: name.trim(),
        courseName: 'Video Editing',
        courseSlug: 'video-editing',
        certificateId: certId,
        isEligible: true,
        certificateSent: false,
        dateOfRegistration: new Date()
      });

      await student.save();
      console.log(`✅ Added: ${name} (${certId})`);
      addedStudents.push({ name: name.trim(), certificateId: certId });
      inserted++;
      existingNames.add(normalizedName);
    } catch (err) {
      console.error(`❌ Error adding ${name}: ${err.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Inserted: ${inserted}`);
  console.log(`⏭️ Skipped (already exist): ${skipped}`);

  if (addedStudents.length > 0) {
    console.log('\n📋 New Video Editing Students Added:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    addedStudents.forEach(s => {
      console.log(`  ${s.name}`);
      console.log(`  Certificate ID: ${s.certificateId}`);
      console.log(`  Verify URL: https://brandmonkacademy.com/verify/${s.certificateId}`);
      console.log('');
    });
  }

  await mongoose.connection.close();
  process.exit(0);
};

addVEStudents().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

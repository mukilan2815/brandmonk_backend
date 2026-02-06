const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
require('dotenv').config();

// New Digital Marketing Students to add - Feb 2026
const newStudents = [
  'Sakthikumaran M',
  'SASIKALA J',
  'nivethitha s'
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

const addNewDMStudents = async () => {
  await connectDB();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Adding New Digital Marketing Students - Feb 2026');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get existing students to check for duplicates and find max certificate number
  const existing = await CourseStudent.find({ courseSlug: 'digital-marketing' });
  const existingNames = new Set(existing.map(s => s.name.toLowerCase().trim()));
  
  // Find the highest existing certificate number
  let maxNum = 0;
  existing.forEach(s => {
    if (s.certificateId && s.certificateId.startsWith('BMADM')) {
      const num = parseInt(s.certificateId.replace('BMADM', ''));
      if (num > maxNum) maxNum = num;
    }
  });

  console.log(`Current highest certificate number: BMADM${String(maxNum).padStart(4, '0')}`);
  console.log(`Total existing DM students: ${existing.length}\n`);

  let inserted = 0;
  let skipped = 0;
  let currentNum = maxNum;
  const addedStudents = [];

  for (const name of newStudents) {
    const normalizedName = name.toLowerCase().trim();
    
    // Check if already exists
    if (existingNames.has(normalizedName)) {
      console.log(`⏭️ Already exists: ${name}`);
      skipped++;
      continue;
    }

    currentNum++;
    const certId = `BMADM${String(currentNum).padStart(4, '0')}`;

    try {
      const student = new CourseStudent({
        name: name.trim(),
        courseName: 'Digital Marketing',
        courseSlug: 'digital-marketing',
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
    console.log('\n📋 New Students Added:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    addedStudents.forEach(s => {
      console.log(`  ${s.name}`);
      console.log(`  Certificate ID: ${s.certificateId}`);
      console.log(`  Verify URL: https://brandmonkacademy.com/verify/${s.certificateId}`);
      console.log('');
    });
  }

  const total = await CourseStudent.countDocuments({ courseSlug: 'digital-marketing' });
  console.log(`\n📊 Total Digital Marketing Students: ${total}`);

  process.exit(0);
};

addNewDMStudents();

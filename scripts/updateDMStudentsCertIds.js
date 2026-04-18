const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
require('dotenv').config();

// Update certificate IDs for the 10 new DM students to proper format
const dmStudents = [
  { oldId: 'BMADM0001', name: 'RAKESH KUMAR.C' },
  { oldId: 'BMADM0002', name: 'S.H.MALICK FIRDHOUSE' },
  { oldId: 'BMADM0003', name: 'Vanmathi Ramasubramanian' },
  { oldId: 'BMADM0004', name: 'Aabi Shankari Karunamoorthi' },
  { oldId: 'BMADM0005', name: 'Kokila.M.S' },
  { oldId: 'BMADM0006', name: 'Bhaheerathi S' },
  { oldId: 'BMADM0007', name: 'Ashiquah S' },
  { oldId: 'BMADM0008', name: 'Aruna P' },
  { oldId: 'BMADM0009', name: 'Sirajudeen N' },
  { oldId: 'BMADM0010', name: 'Haripriya P' }
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

const updateDMStudents = async () => {
  await connectDB();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Updating DM Students Certificate IDs to proper format');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Find the highest existing certificate number in BMAJUNDMMES format
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
  console.log(`Starting new IDs from: BMAJUNDMMES/Q0506S${String(maxNum + 1).padStart(3, '0')}\n`);

  let updated = 0;
  let failed = 0;
  let currentNum = maxNum;

  for (const student of dmStudents) {
    currentNum++;
    const newId = `BMAJUNDMMES/Q0506S${String(currentNum).padStart(3, '0')}`;

    try {
      const result = await CourseStudent.findOneAndUpdate(
        { certificateId: student.oldId },
        { certificateId: newId },
        { new: true }
      );

      if (result) {
        console.log(`✅ ${result.name}`);
        console.log(`   Old ID: ${student.oldId}`);
        console.log(`   New ID: ${newId}`);
        console.log(`   Verify: https://brandmonkacademy.com/verify/${newId}`);
        console.log('');
        updated++;
      } else {
        console.log(`❌ Not found: ${student.name} (${student.oldId})`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ Error updating ${student.name}: ${err.message}`);
      failed++;
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.connection.close();
  process.exit(0);
};

updateDMStudents().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

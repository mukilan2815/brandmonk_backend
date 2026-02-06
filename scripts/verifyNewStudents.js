const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const students = await CourseStudent.find({ 
    certificateId: { $in: ['BMADM0001', 'BMADM0002', 'BMADM0003'] } 
  });
  
  console.log('\n✅ Verified students in database:\n');
  students.forEach(s => {
    console.log(`  Name: ${s.name}`);
    console.log(`  Certificate ID: ${s.certificateId}`);
    console.log(`  Course: ${s.courseName}`);
    console.log(`  QR Verify URL: https://brandmonkacademy.com/verify/${s.certificateId}`);
    console.log('');
  });
  
  process.exit(0);
});

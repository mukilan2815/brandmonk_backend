const mongoose = require('mongoose');
const CourseStudent = require('./models/CourseStudent');

async function fixCert() {
  await mongoose.connect('mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0');
  
  const student = await CourseStudent.findOne({ name: /PRATHEEBARAN/i });
  if (student) {
    console.log('Found student:', student);
    student.certificateId = 'BMAJANDMMES/Q0406S332';
    // optionally fix name if needed
    student.name = 'PRATHEEBARAN RAMAKRISHNAN';
    await student.save();
    console.log('Successfully updated student with correct certificate ID: BMAJANDMMES/Q0406S332');
  } else {
    console.log('Student not found');
  }
  
  process.exit(0);
}

fixCert();

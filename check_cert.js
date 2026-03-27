const mongoose = require('mongoose');
const CourseStudent = require('./models/CourseStudent');

async function check() {
  await mongoose.connect('mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0');
  
  const s = await CourseStudent.findOne({ name: /PRATHEEBARAN/i });
  console.log('by name:', s);
  
  const s2 = await CourseStudent.findOne({ certificateId: 'BMAJANDMMES/Q0406S332' });
  console.log('by cert ID exactly:', s2);
  
  process.exit(0);
}

check();

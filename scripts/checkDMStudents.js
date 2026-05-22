const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');

const MONGO_URI = 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

async function checkDMStudents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const students = await CourseStudent.find({
      courseSlug: 'digital-marketing'
    }).sort({ name: 1 });

    console.log(`📊 Total Digital Marketing students in database: ${students.length}\n`);

    if (students.length > 0) {
      console.log('Students:');
      students.forEach(s => {
        console.log(`  ${s.name.padEnd(40)} | ${s.certificateId}`);
      });
    }

    // Check specifically for P JAYASHRI variations
    console.log('\n🔍 Searching for variations of "JAYASHRI":');
    const jayashriRecords = await CourseStudent.find({
      name: { $regex: 'JAYASHRI', $options: 'i' }
    });
    console.log(`   Found: ${jayashriRecords.length} record(s)`);
    jayashriRecords.forEach(r => {
      console.log(`   - ${r.name} | ${r.certificateId}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkDMStudents();

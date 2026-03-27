const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected');

    const student = await CourseStudent.findOne({
      name: { $regex: /^Payal D Goklani$/i },
      courseSlug: 'digital-marketing'
    });

    if (!student) {
      console.log('❌ Payal D Goklani not found!');
      return;
    }

    console.log(`Found: ${student.name}`);
    console.log(`Certificate ID: ${student.certificateId}`);
    console.log(`Current dateOfRegistration: ${student.dateOfRegistration}`);
    console.log(`Current createdAt:          ${student.createdAt}`);

    const correctDate = new Date('2026-01-12');

    student.dateOfRegistration = correctDate;
    await student.save();

    console.log(`\n✅ Updated dateOfRegistration to: ${correctDate.toDateString()}`);

    // Verify
    const updated = await CourseStudent.findOne({ _id: student._id });
    console.log(`✅ Verified new dateOfRegistration: ${updated.dateOfRegistration}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    await mongoose.connection.close();
    console.log('Done.');
    process.exit(0);
  }
};

run();

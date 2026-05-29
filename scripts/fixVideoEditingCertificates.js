const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CourseStudent = require('../models/CourseStudent');

dotenv.config();

async function fixCertificates() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Update Asmath Nisha
    const asmath = await CourseStudent.findOneAndUpdate(
      { name: 'Asmath Nisha', courseSlug: 'video-editing' },
      { certificateId: 'BMAJUNVEMES/Q1401S022' },
      { new: true }
    );

    if (asmath) {
      console.log(`✅ Updated Asmath Nisha: ${asmath.certificateId}`);
    } else {
      console.log(`❌ Asmath Nisha not found`);
    }

    // Update Shruthi S
    const shruthi = await CourseStudent.findOneAndUpdate(
      { name: 'Shruthi S', courseSlug: 'video-editing' },
      { certificateId: 'BMAJUNVEMES/Q1401S026' },
      { new: true }
    );

    if (shruthi) {
      console.log(`✅ Updated Shruthi S: ${shruthi.certificateId}`);
    } else {
      console.log(`❌ Shruthi S not found`);
    }

    console.log('\n========================================');
    console.log('✅ Certificates updated successfully!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

fixCertificates();

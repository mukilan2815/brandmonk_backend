const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CourseStudent = require('../models/CourseStudent');

dotenv.config();

const studentsToAdd = [
  { name: "Asmath Nisha", courseName: "Video Editing", courseSlug: "video-editing" },
  { name: "Shruthi S", courseName: "Video Editing", courseSlug: "video-editing" }
];

async function addCertificates() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const studentData of studentsToAdd) {
      try {
        // Check if student already exists
        const existing = await CourseStudent.findOne({
          name: studentData.name.trim(),
          courseSlug: studentData.courseSlug
        });

        if (existing) {
          console.log(`⚠️  Already exists: ${studentData.name} (ID: ${existing.certificateId})`);
          results.skipped.push({
            name: studentData.name,
            reason: 'Student already exists',
            certificateId: existing.certificateId
          });
          continue;
        }

        // Generate certificate ID
        const count = await CourseStudent.countDocuments({ courseSlug: studentData.courseSlug });
        const certificateId = `BMAVE${(count + 1).toString().padStart(5, '0')}`;

        // Create new student
        const student = new CourseStudent({
          name: studentData.name.trim(),
          courseName: studentData.courseName,
          courseSlug: studentData.courseSlug,
          certificateId,
          isEligible: true,
          dateOfRegistration: new Date()
        });

        const savedStudent = await student.save();
        console.log(`✅ Added: ${savedStudent.name}`);
        console.log(`   Certificate ID: ${savedStudent.certificateId}\n`);

        results.success.push({
          name: savedStudent.name,
          certificateId: savedStudent.certificateId,
          course: savedStudent.courseName
        });
      } catch (error) {
        console.log(`❌ Failed to add ${studentData.name}: ${error.message}\n`);
        results.failed.push({
          name: studentData.name,
          error: error.message
        });
      }
    }

    console.log('\n========================================');
    console.log('📊 SUMMARY');
    console.log('========================================');
    console.log(`✅ Added: ${results.success.length}`);
    console.log(`⚠️  Skipped: ${results.skipped.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log('========================================\n');

    if (results.success.length > 0) {
      console.log('✅ Successfully Added:');
      results.success.forEach(s => {
        console.log(`   • ${s.name} - ${s.certificateId}`);
      });
    }

    if (results.skipped.length > 0) {
      console.log('\n⚠️  Already Existed:');
      results.skipped.forEach(s => {
        console.log(`   • ${s.name} - ${s.certificateId}`);
      });
    }

    if (results.failed.length > 0) {
      console.log('\n❌ Failed to Add:');
      results.failed.forEach(s => {
        console.log(`   • ${s.name} - ${s.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

addCertificates();

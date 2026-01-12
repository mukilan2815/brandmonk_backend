const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CourseStudent = require('../models/CourseStudent');

dotenv.config();

async function cleanupDuplicateStudents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all Video Editing students
    const allStudents = await CourseStudent.find({ 
      courseSlug: 'video-editing' 
    }).sort({ createdAt: 1 }); // Oldest first

    console.log(`\n📊 Found ${allStudents.length} Video Editing students in database\n`);

    // Students with old format IDs (BMAVE####)
    const oldFormatStudents = allStudents.filter(s => 
      s.certificateId.match(/^BMAVE\d{4}$/)
    );

    // Students with new format IDs (BMAXXXVEMES/Q1401S###)
    const newFormatStudents = allStudents.filter(s => 
      s.certificateId.match(/^BMA[A-Z]+VEMES\/Q1401S\d+$/)
    );

    console.log(`📋 Old format (BMAVE####): ${oldFormatStudents.length} students`);
    console.log(`📋 New format (BMAXXXVEMES/Q1401S###): ${newFormatStudents.length} students\n`);

    if (oldFormatStudents.length === 0) {
      console.log('✅ No old format students to delete. Database is clean!');
      return;
    }

    console.log('🗑️  Students to be DELETED (old format):');
    console.log('==========================================');
    oldFormatStudents.forEach(s => {
      console.log(`   ${s.name} → ${s.certificateId}`);
    });

    console.log('\n✅ Students to be KEPT (new format):');
    console.log('==========================================');
    newFormatStudents.forEach(s => {
      console.log(`   ${s.name} → ${s.certificateId}`);
    });

    console.log('\n⚠️  WARNING: This will delete the old format students!');
    console.log('Proceeding in 3 seconds...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete old format students
    const deleteResult = await CourseStudent.deleteMany({
      courseSlug: 'video-editing',
      certificateId: { $regex: /^BMAVE\d{4}$/ }
    });

    console.log('\n========================================');
    console.log('📊 CLEANUP SUMMARY');
    console.log('========================================');
    console.log(`🗑️  Deleted: ${deleteResult.deletedCount} old format students`);
    console.log(`✅ Kept: ${newFormatStudents.length} new format students`);
    console.log('========================================\n');

    // Verify final count
    const finalCount = await CourseStudent.countDocuments({ 
      courseSlug: 'video-editing' 
    });
    console.log(`✅ Final count: ${finalCount} Video Editing students\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

cleanupDuplicateStudents();

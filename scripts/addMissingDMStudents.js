const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CourseStudent = require('../models/CourseStudent');

dotenv.config();

// Missing students that need to be added
const missingStudents = [
  { name: "ASWANI. MS", certificateId: "BMAJANDMMES/Q0406S695" },
  { name: "VARUN MOGLI", certificateId: "BMAJANDMMES/Q0406S213" },
  { name: "JANANI D", certificateId: "BMAJANDMMES/Q0406S808" },
  { name: "SARULATHA M", certificateId: "BMAJANDMMES/Q0406S950" },
  { name: "K.GEETHA", certificateId: "BMAJANDMMES/Q0406S161" },
  { name: "RUTH SALLY GOMEZ", certificateId: "BMAJANDMMES/Q0406S350" },
  { name: "RABIN AROKIANATHAN", certificateId: "BMAJANDMMES/Q0406S158" },
  { name: "LEO. A", certificateId: "BMAJANDMMES/Q0406S657" },
  { name: "FRANCIS J", certificateId: "BMAJANDMMES/Q0406S691" },
  { name: "SAVARI ARUN U", certificateId: "BMAJANDMMES/Q0406S392" },
  { name: "ABINAYA T", certificateId: "BMAJANDMMES/Q0406S175" },
  { name: "M.ISHWARYA", certificateId: "BMAJANDMMES/Q0406S972" },
  { name: "YUVAREKHA A", certificateId: "BMAJANDMMES/Q0406S288" },
  { name: "S RAGUL", certificateId: "BMAJANDMMES/Q0406S908" },
  { name: "RAMSANKAR", certificateId: "BMAJANDMMES/Q0406S442" }
];

async function addMissingDMStudents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    let added = 0;
    let skipped = 0;

    for (const student of missingStudents) {
      try {
        // Check if student already exists by certificate ID
        const existing = await CourseStudent.findOne({ 
          certificateId: student.certificateId 
        });

        if (existing) {
          console.log(`⏭️  Skipped (exists): ${student.name} (${student.certificateId})`);
          skipped++;
        } else {
          // Add new student
          const newStudent = new CourseStudent({
            name: student.name.trim(),
            courseName: 'Digital Marketing',
            courseSlug: 'digital-marketing',
            certificateId: student.certificateId,
            isEligible: true,
            certificateSent: false,
            dateOfRegistration: new Date()
          });

          await newStudent.save();
          console.log(`✅ Added: ${student.name} (${student.certificateId})`);
          added++;
        }
      } catch (err) {
        console.error(`❌ Error processing ${student.name}:`, err.message);
      }
    }

    console.log('\n========================================');
    console.log('📊 SUMMARY');
    console.log('========================================');
    console.log(`✅ Added: ${added}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📝 Total Processed: ${missingStudents.length}`);
    console.log('========================================\n');

    // Verify final count
    const finalCount = await CourseStudent.countDocuments({ 
      courseSlug: 'digital-marketing' 
    });
    console.log(`✅ Total Digital Marketing students: ${finalCount}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

addMissingDMStudents();

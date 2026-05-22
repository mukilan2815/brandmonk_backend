const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');

const MONGO_URI = 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

// Mapping of student names to their correct certificate IDs for Digital Marketing
const studentCertificateMapping = [
  { name: "P JAYASHRI", certificateId: "BMASEPDMMES/Q0706S414" },
  { name: "BLESSIE S", certificateId: "BMAJULDMMES/Q0706S380" },
  { name: "HARSHNI P", certificateId: "BMASEPDMMES/Q0706S413" }
];

function normalizeName(name) {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
    .replace(/,/g, '');
}

async function addMissingDMStudents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const allStudents = await CourseStudent.find({
      courseSlug: 'digital-marketing'
    });

    console.log(`📊 Currently have ${allStudents.length} Digital Marketing students in database\n`);

    let added = 0;
    let skipped = 0;
    const missingStudents = [];

    for (const mapping of studentCertificateMapping) {
      const normalizedMappingName = normalizeName(mapping.name);

      let exists = allStudents.find(s =>
        normalizeName(s.name) === normalizedMappingName
      );

      if (!exists) {
        exists = allStudents.find(s => {
          const normalizedDbName = normalizeName(s.name);
          return normalizedDbName.includes(normalizedMappingName) ||
                 normalizedMappingName.includes(normalizedDbName);
        });
      }

      if (!exists) {
        missingStudents.push(mapping);
      } else {
        skipped++;
      }
    }

    console.log(`📋 Missing students that need to be added: ${missingStudents.length}\n`);

    if (missingStudents.length > 0) {
      console.log('Adding missing students...\n');

      for (const student of missingStudents) {
        try {
          const newStudent = new CourseStudent({
            name: student.name,
            courseName: 'Digital Marketing',
            courseSlug: 'digital-marketing',
            certificateId: student.certificateId,
            isEligible: true,
            certificateSent: false,
            dateOfRegistration: new Date()
          });

          await newStudent.save();
          console.log(`✅ Added: ${student.name} → ${student.certificateId}`);
          added++;
        } catch (error) {
          if (error.code === 11000) {
            console.log(`⚠️  Skipped: ${student.name} (Certificate ID already exists)`);
          } else {
            console.log(`❌ Error adding ${student.name}: ${error.message}`);
          }
        }
      }
    }

    console.log('\n========================================');
    console.log('📊 SUMMARY');
    console.log('========================================');
    console.log(`✅ Added: ${added}`);
    console.log(`⏭️  Skipped (already exists): ${skipped}`);
    console.log('========================================\n');

    console.log('🔬 Verifying P JAYASHRI...');
    const pJayashri = await CourseStudent.findOne({
      certificateId: 'BMASEPDMMES/Q0706S414'
    });

    if (pJayashri) {
      console.log(`✅ P JAYASHRI is now in the database!`);
      console.log(`   - Name: ${pJayashri.name}`);
      console.log(`   - Certificate ID: ${pJayashri.certificateId}`);
      console.log(`   - Eligible: ${pJayashri.isEligible}\n`);
    } else {
      console.log(`❌ P JAYASHRI still not found\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

addMissingDMStudents();

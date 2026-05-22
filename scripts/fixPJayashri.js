const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');

const MONGO_URI = 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

async function fixPJayashri() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const targetName = "P JAYASHRI";
    const correctCertId = "BMASEPDMMES/Q0706S414";

    // Find all records for P JAYASHRI
    const pJayashriRecords = await CourseStudent.find({
      name: { $regex: targetName, $options: 'i' }
    });

    console.log(`📋 Found ${pJayashriRecords.length} record(s) for P JAYASHRI:`);
    for (const record of pJayashriRecords) {
      console.log(`   - _id: ${record._id}`);
      console.log(`   - name: ${record.name}`);
      console.log(`   - certificateId: ${record.certificateId}`);
      console.log(`   - courseName: ${record.courseName}`);
      console.log('');
    }

    // Check if the target certificate ID exists elsewhere
    const existingWithId = await CourseStudent.findOne({
      certificateId: correctCertId
    });

    console.log(`🔍 Checking for existing record with ID: ${correctCertId}`);
    if (existingWithId) {
      console.log(`   ⚠️  Found existing record:`);
      console.log(`   - _id: ${existingWithId._id}`);
      console.log(`   - name: ${existingWithId.name}`);
      console.log(`   - certificateId: ${existingWithId.certificateId}`);
      console.log('');

      // If it's a different person with the same ID, we have a problem
      if (existingWithId.name !== targetName) {
        console.log(`   ❌ CONFLICT: Different student has this certificate ID!`);
        console.log(`   This needs manual resolution.\n`);
      } else {
        console.log(`   ✓ Same person, no action needed.\n`);
      }
    } else {
      console.log(`   ✓ No conflict, ID is available\n`);
    }

    // If P JAYASHRI has a different cert ID, update it
    if (pJayashriRecords.length === 1) {
      const record = pJayashriRecords[0];
      if (record.certificateId !== correctCertId) {
        console.log(`🔄 Updating certificate ID for P JAYASHRI`);
        console.log(`   Old ID: ${record.certificateId}`);
        console.log(`   New ID: ${correctCertId}`);

        record.certificateId = correctCertId;
        await record.save();
        console.log(`   ✅ Update successful!\n`);
      } else {
        console.log(`✓ P JAYASHRI already has the correct certificate ID\n`);
      }
    } else if (pJayashriRecords.length > 1) {
      console.log(`❌ Multiple records found for P JAYASHRI!`);
      console.log(`   This needs manual cleanup first.\n`);
    }

    // Test verification by scanning the QR
    console.log(`🔬 Testing QR verification...`);
    const verifyTest = await CourseStudent.findOne({
      certificateId: correctCertId
    });

    if (verifyTest && verifyTest.name.includes("JAYASHRI")) {
      console.log(`   ✅ Verification successful! Student found.`);
      console.log(`   - Name: ${verifyTest.name}`);
      console.log(`   - Course: ${verifyTest.courseName}`);
      console.log(`   - Eligible: ${verifyTest.isEligible}\n`);
    } else {
      console.log(`   ❌ Verification failed! Student not found.\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

fixPJayashri();

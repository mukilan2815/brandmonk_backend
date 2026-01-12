const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('../models/Student');
require('dotenv').config();

// Find the latest firebase backup file
const files = fs.readdirSync('.').filter(f => f.startsWith('firebase_backup_') && f.endsWith('.json'));
if (files.length === 0) {
  console.log('No firebase backup file found. Run downloadFirebaseData.js first.');
  process.exit(1);
}

const latestBackup = files.sort().reverse()[0];
console.log(`Using backup file: ${latestBackup}\n`);

const firebaseData = JSON.parse(fs.readFileSync(latestBackup, 'utf-8'));

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected\n');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

const exportMissingStudents = async () => {
  await connectDB();

  // Get all students from MongoDB
  const mongoStudents = await Student.find({});
  console.log(`MongoDB Students: ${mongoStudents.length}`);
  console.log(`Firebase Students: ${firebaseData.students.length}\n`);

  // Create sets for comparison
  const mongoEmails = new Set(mongoStudents.map(s => s.email?.toLowerCase().trim()));
  const mongoIds = new Set(mongoStudents.map(s => s._id.toString()));
  const mongoCertIds = new Set(mongoStudents.map(s => s.certificateId).filter(Boolean));

  // Find students in Firebase but NOT in MongoDB
  const missingInMongo = [];
  
  for (const fbStudent of firebaseData.students) {
    const fbEmail = (fbStudent.email || '').toLowerCase().trim();
    const fbId = fbStudent._id || fbStudent.id;
    const fbCertId = fbStudent.certificateId;
    
    const foundById = mongoIds.has(fbId);
    const foundByEmail = mongoEmails.has(fbEmail);
    const foundByCertId = fbCertId && mongoCertIds.has(fbCertId);
    
    if (!foundById && !foundByEmail && !foundByCertId) {
      missingInMongo.push({
        // Keep all original Firebase data for restoration
        name: fbStudent.name,
        email: fbStudent.email,
        phone: fbStudent.phone || 'N/A',
        webinarName: fbStudent.webinarName,
        webinarSlug: fbStudent.webinarSlug || null,
        webinarId: fbStudent.webinarId || null,
        location: fbStudent.location || 'Online',
        profession: fbStudent.profession || 'Others',
        certificateId: fbStudent.certificateId,
        isEligible: fbStudent.isEligible || false,
        hasFollowedInstagram: fbStudent.hasFollowedInstagram || false,
        certificateSent: fbStudent.certificateSent || false,
        dateOfRegistration: fbStudent.dateOfRegistration || fbStudent.createdAt,
        collegeOrCompany: fbStudent.collegeOrCompany || '',
        department: fbStudent.department || '',
        yearOfStudyOrExperience: fbStudent.yearOfStudyOrExperience || '',
        firebaseId: fbId,
        backupTimestamp: fbStudent.backupTimestamp
      });
    }
  }

  // Group by webinar for summary
  const byWebinar = {};
  missingInMongo.forEach(s => {
    const key = s.webinarName || 'Unknown';
    if (!byWebinar[key]) byWebinar[key] = [];
    byWebinar[key].push(s);
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`TOTAL MISSING IN MONGODB: ${missingInMongo.length} students`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Breakdown by Webinar:');
  Object.entries(byWebinar).sort((a, b) => b[1].length - a[1].length).forEach(([name, students]) => {
    console.log(`  ${name}: ${students.length} students`);
  });

  // Save to JSON file
  const outputFilename = `missing_students_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const outputData = {
    exportedAt: new Date().toISOString(),
    totalMissing: missingInMongo.length,
    summary: Object.entries(byWebinar).map(([name, students]) => ({ webinar: name, count: students.length })),
    students: missingInMongo
  };

  fs.writeFileSync(outputFilename, JSON.stringify(outputData, null, 2));
  
  console.log(`\n📁 Exported to: ${outputFilename}`);
  console.log(`   Ready to restore ${missingInMongo.length} students to MongoDB`);

  process.exit(0);
};

exportMissingStudents();

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

const compareData = async () => {
  await connectDB();

  // Get all students from MongoDB
  const mongoStudents = await Student.find({});
  console.log(`MongoDB Students: ${mongoStudents.length}`);
  console.log(`Firebase Students: ${firebaseData.students.length}\n`);

  // Create sets for comparison using email as unique identifier
  const mongoEmails = new Set(mongoStudents.map(s => s.email?.toLowerCase().trim()));
  const mongoIds = new Set(mongoStudents.map(s => s._id.toString()));
  const mongoCertIds = new Set(mongoStudents.map(s => s.certificateId).filter(Boolean));

  // Find students in Firebase but NOT in MongoDB
  const missingInMongo = [];
  
  for (const fbStudent of firebaseData.students) {
    const fbEmail = (fbStudent.email || '').toLowerCase().trim();
    const fbId = fbStudent._id || fbStudent.id;
    const fbCertId = fbStudent.certificateId;
    
    // Check by ID, email, or certificateId
    const foundById = mongoIds.has(fbId);
    const foundByEmail = mongoEmails.has(fbEmail);
    const foundByCertId = fbCertId && mongoCertIds.has(fbCertId);
    
    if (!foundById && !foundByEmail && !foundByCertId) {
      missingInMongo.push({
        name: fbStudent.name,
        email: fbStudent.email,
        webinarName: fbStudent.webinarName,
        certificateId: fbStudent.certificateId,
        firebaseId: fbId
      });
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`STUDENTS IN FIREBASE BUT MISSING IN MONGODB: ${missingInMongo.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (missingInMongo.length === 0) {
    console.log('✅ All Firebase students exist in MongoDB!');
  } else {
    missingInMongo.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name}`);
      console.log(`   Email: ${s.email}`);
      console.log(`   Program: ${s.webinarName}`);
      console.log(`   Certificate ID: ${s.certificateId || 'N/A'}`);
      console.log('');
    });
  }

  // Also check reverse - students in MongoDB but not in Firebase (for info)
  const firebaseEmails = new Set(firebaseData.students.map(s => (s.email || '').toLowerCase().trim()));
  const missingInFirebase = mongoStudents.filter(s => !firebaseEmails.has(s.email?.toLowerCase().trim()));
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`STUDENTS IN MONGODB BUT NOT IN FIREBASE: ${missingInFirebase.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (missingInFirebase.length > 0 && missingInFirebase.length <= 20) {
    missingInFirebase.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name} (${s.email}) - ${s.webinarName}`);
    });
  } else if (missingInFirebase.length > 20) {
    console.log(`(Showing first 20 of ${missingInFirebase.length})`);
    missingInFirebase.slice(0, 20).forEach((s, i) => {
      console.log(`${i + 1}. ${s.name} (${s.email}) - ${s.webinarName}`);
    });
  }

  console.log('\n✅ Comparison complete. No changes made to any database.');
  process.exit(0);
};

compareData();

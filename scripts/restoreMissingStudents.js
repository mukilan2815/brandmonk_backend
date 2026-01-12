const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('../models/Student');
const Webinar = require('../models/Webinar');
require('dotenv').config();

// Find the latest missing students file
const files = fs.readdirSync('.').filter(f => f.startsWith('missing_students_') && f.endsWith('.json'));
if (files.length === 0) {
  console.log('No missing_students file found. Run exportMissingStudents.js first.');
  process.exit(1);
}

const latestExport = files.sort().reverse()[0];
console.log(`Using export file: ${latestExport}\n`);

const missingData = JSON.parse(fs.readFileSync(latestExport, 'utf-8'));

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected\n');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

// Helper: Find the best matching webinar for a student based on name and date
const findBestWebinar = (student, webinars) => {
  const studentWebinarName = (student.webinarName || '').toLowerCase().trim();
  const studentDate = new Date(student.dateOfRegistration || student.backupTimestamp);
  
  // Filter webinars by matching name
  const matchingWebinars = webinars.filter(w => {
    const wName = (w.name || '').toLowerCase().trim();
    return wName === studentWebinarName || 
           wName.includes(studentWebinarName) || 
           studentWebinarName.includes(wName);
  });

  if (matchingWebinars.length === 0) {
    return null; // No matching webinar found
  }

  if (matchingWebinars.length === 1) {
    return matchingWebinars[0];
  }

  // Multiple webinars with same name - find the one closest in date
  // Students typically register on webinar day or day after
  let bestMatch = null;
  let smallestDiff = Infinity;

  for (const webinar of matchingWebinars) {
    const webinarDate = new Date(webinar.date || webinar.createdAt);
    const diff = Math.abs(studentDate.getTime() - webinarDate.getTime());
    
    // Student should register ON or AFTER webinar date (within 3 days is reasonable)
    const daysDiff = diff / (1000 * 60 * 60 * 24);
    
    if (daysDiff < smallestDiff && studentDate >= new Date(webinarDate.getTime() - 24*60*60*1000)) {
      smallestDiff = daysDiff;
      bestMatch = webinar;
    }
  }

  // If no good match found, use the most recent webinar before registration
  if (!bestMatch) {
    const sortedByDate = matchingWebinars
      .filter(w => new Date(w.date || w.createdAt) <= studentDate)
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    
    if (sortedByDate.length > 0) {
      bestMatch = sortedByDate[0];
    } else {
      // Fallback to the earliest webinar
      bestMatch = matchingWebinars.sort((a, b) => 
        new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)
      )[0];
    }
  }

  return bestMatch;
};

const restoreStudents = async () => {
  await connectDB();

  // Get all webinars from MongoDB
  const webinars = await Webinar.find({});
  console.log(`Found ${webinars.length} webinars in MongoDB\n`);

  // Show webinar list
  console.log('Available Webinars:');
  webinars.forEach(w => {
    const date = new Date(w.date || w.createdAt).toLocaleDateString('en-IN');
    console.log(`  - ${w.name} (${date}) [${w.slug}]`);
  });
  console.log('');

  const students = missingData.students;
  console.log(`Students to restore: ${students.length}\n`);

  // Check for existing students to avoid duplicates
  const existingEmails = new Set(
    (await Student.find({}, { email: 1 })).map(s => s.email?.toLowerCase().trim())
  );
  const existingCertIds = new Set(
    (await Student.find({}, { certificateId: 1 })).map(s => s.certificateId).filter(Boolean)
  );

  let restored = 0;
  let skipped = 0;
  let failed = 0;
  const assignments = {}; // Track how many assigned to each webinar

  for (const student of students) {
    const email = (student.email || '').toLowerCase().trim();
    
    // Skip if already exists
    if (existingEmails.has(email)) {
      skipped++;
      continue;
    }
    if (student.certificateId && existingCertIds.has(student.certificateId)) {
      skipped++;
      continue;
    }

    // Find the best matching webinar
    const matchedWebinar = findBestWebinar(student, webinars);

    if (!matchedWebinar) {
      console.log(`⚠️ No webinar match for: ${student.name} (${student.webinarName})`);
      failed++;
      continue;
    }

    try {
      const newStudent = new Student({
        name: student.name,
        email: student.email,
        phone: student.phone || 'N/A',
        webinarId: matchedWebinar._id,
        webinarName: matchedWebinar.name,
        webinarSlug: matchedWebinar.slug,
        location: student.location || 'Online',
        profession: student.profession || 'Others',
        certificateId: student.certificateId,
        isEligible: student.isEligible || false,
        hasFollowedInstagram: student.hasFollowedInstagram || false,
        certificateSent: student.certificateSent || false,
        dateOfRegistration: student.dateOfRegistration || new Date(),
        collegeOrCompany: student.collegeOrCompany || '',
        department: student.department || '',
        yearOfStudyOrExperience: student.yearOfStudyOrExperience || ''
      });

      await newStudent.save();
      restored++;
      existingEmails.add(email);
      if (student.certificateId) existingCertIds.add(student.certificateId);

      // Track assignments
      const key = `${matchedWebinar.name} (${new Date(matchedWebinar.date).toLocaleDateString('en-IN')})`;
      assignments[key] = (assignments[key] || 0) + 1;

      if (restored % 100 === 0) {
        console.log(`Restored ${restored} students...`);
      }
    } catch (err) {
      console.error(`Error restoring ${student.name}: ${err.message}`);
      failed++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RESTORATION COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Restored: ${restored}`);
  console.log(`⏭️ Skipped (duplicates): ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  console.log('Assignments by Webinar:');
  Object.entries(assignments)
    .sort((a, b) => b[1] - a[1])
    .forEach(([webinar, count]) => {
      console.log(`  ${webinar}: ${count} students`);
    });

  // Verify final count
  const finalCount = await Student.countDocuments();
  console.log(`\n📊 Total students in MongoDB now: ${finalCount}`);

  process.exit(0);
};

restoreStudents();

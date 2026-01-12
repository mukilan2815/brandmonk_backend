const mongoose = require('mongoose');
const Student = require('../models/Student');
const Webinar = require('../models/Webinar');
require('dotenv').config();

// Parse the student data - we'll read from the raw data
const rawStudentData = `Vidhyambigai S,vidhyambigais1768193316550@bma.temp,Video Editing,Course,12 Jan 2026,SMAPARMQ0765503
Vishnusithan A,vishnusithana1768193316238@bma.temp,Video Editing,Course,12 Jan 2026,SMAPARMQ0765502
SIKENDAR BASHA M,sikendarbasham1768193316097@bma.temp,Video Editing,Course,12 Jan 2026,SMAPARMQ0765501
Mugilarasu G,mugilarasug1768193315953@bma.temp,Video Editing,Course,12 Jan 2026,SMAPARMQ0765500
Bindhu N,bindhun1768193315755@bma.temp,Video Editing,Course,12 Jan 2026,SMAPARMQ0765499
THIKA P,thikap1768193315613@bma.temp,Video Editing,Course,12 Jan 2026,SMAPARMQ0765498
KARTHIK C,karthikc1768193315302@bma.temp,Video Editing,Course,12 Jan 2026,SMAPARMQ0765497
Surya Narayanan,suryanarayanan1768193315146@bma.temp,Video Editing,Course,12 Jan 2026,SMAPARMQ0765496
J.Lakshnanan,jlakshnanan1768193314748@bma.temp,Video Editing,Course,12 Jan 2026,SMAPARMQ0765495
Monisha Valli M V,monishavallimv1768193314597@bma.temp,Video Editing,Course,12 Jan 2026,SMAPARMQ0765494`;

// Instead, let's update students by Certificate ID 
// Group by webinar target based on program name and date

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected\n');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

// Helper: Parse date like "12 Jan 2026" to Date object
const parseDate = (dateStr) => {
  const months = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  const parts = dateStr.trim().split(' ');
  const day = parseInt(parts[0]);
  const month = months[parts[1]];
  const year = parseInt(parts[2]);
  return new Date(year, month, day);
};

// Helper: Find the best webinar for a student
const findBestWebinar = (programName, regDate, webinars) => {
  // Normalize program name
  const normalizedName = programName.toLowerCase().trim()
    .replace('digital  marketing', 'digital marketing')
    .replace('agentic ai', 'agentic ai');
  
  // Filter webinars by matching name
  const matchingWebinars = webinars.filter(w => {
    const wName = w.name.toLowerCase().trim();
    return wName === normalizedName || 
           wName.includes(normalizedName) || 
           normalizedName.includes(wName.split(' ')[0]);
  });

  if (matchingWebinars.length === 0) return null;
  if (matchingWebinars.length === 1) return matchingWebinars[0];

  // Multiple webinars - find the one closest to registration date
  // Student registers on webinar day or day after
  let bestMatch = null;
  let smallestDiff = Infinity;

  for (const webinar of matchingWebinars) {
    const webinarDate = new Date(webinar.date);
    const diff = regDate.getTime() - webinarDate.getTime();
    const daysDiff = diff / (1000 * 60 * 60 * 24);
    
    // Student typically registers 0-2 days after webinar opens
    // Prefer webinars where student reg date is ON or AFTER webinar date
    if (daysDiff >= -1 && daysDiff < smallestDiff) {
      smallestDiff = daysDiff;
      bestMatch = webinar;
    }
  }

  // Fallback: get the most recent webinar before registration
  if (!bestMatch) {
    const sortedWebinars = matchingWebinars
      .filter(w => new Date(w.date) <= regDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    bestMatch = sortedWebinars[0] || matchingWebinars[0];
  }

  return bestMatch;
};

const assignStudentsToWebinars = async () => {
  await connectDB();

  // Get all webinars
  const webinars = await Webinar.find({});
  console.log(`Found ${webinars.length} webinars\n`);

  // Get all students that have "Course" type issues or wrong webinar assignment
  // We'll update students by certificate ID
  
  const students = await Student.find({});
  console.log(`Total students in DB: ${students.length}\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const assignments = {};

  for (const student of students) {
    // Skip if student already has correct webinar assignment
    if (student.webinarId && student.webinarSlug) {
      // Check if the webinar exists
      const existingWebinar = webinars.find(w => w._id.toString() === student.webinarId?.toString());
      if (existingWebinar) {
        skipped++;
        continue;
      }
    }

    // Get program name from student
    const programName = student.webinarName || 'Unknown';
    const regDate = new Date(student.dateOfRegistration || student.createdAt);

    // Find best matching webinar
    const matchedWebinar = findBestWebinar(programName, regDate, webinars);

    if (!matchedWebinar) {
      console.log(`⚠️ No webinar match: ${student.name} (${programName})`);
      failed++;
      continue;
    }

    // Update the student
    try {
      await Student.updateOne(
        { _id: student._id },
        {
          $set: {
            webinarId: matchedWebinar._id,
            webinarSlug: matchedWebinar.slug,
            webinarName: matchedWebinar.name
          }
        }
      );
      updated++;

      const key = `${matchedWebinar.name} (${new Date(matchedWebinar.date).toLocaleDateString('en-IN')})`;
      assignments[key] = (assignments[key] || 0) + 1;

      if (updated % 100 === 0) {
        console.log(`Updated ${updated} students...`);
      }
    } catch (err) {
      console.error(`Error updating ${student.name}: ${err.message}`);
      failed++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ASSIGNMENT COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️ Skipped (already assigned): ${skipped}`);
  console.log(`❌ Failed: ${failed}`);

  if (Object.keys(assignments).length > 0) {
    console.log('\nNew Assignments by Webinar:');
    Object.entries(assignments)
      .sort((a, b) => b[1] - a[1])
      .forEach(([webinar, count]) => {
        console.log(`  ${webinar}: ${count} students`);
      });
  }

  // Verify webinar counts
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('WEBINAR REGISTRATION COUNTS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const webinar of webinars.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20)) {
    const count = await Student.countDocuments({ 
      $or: [
        { webinarId: webinar._id },
        { webinarSlug: webinar.slug }
      ]
    });
    const date = new Date(webinar.date).toLocaleDateString('en-IN');
    console.log(`${webinar.name} (${date}): ${count} students`);
  }

  process.exit(0);
};

assignStudentsToWebinars();

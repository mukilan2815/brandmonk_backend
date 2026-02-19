const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const LOG_FILE = path.join(__dirname, 'output.txt');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(LOG_FILE, msg + '\n');
}

// Clear log file
fs.writeFileSync(LOG_FILE, 'Starting script...\n');

// Use URI from env or fallback
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

// 1. Specific Students (Fixing Verification)
const specificStudents = [
  {
    name: 'Payal D Goklani',
    certificateId: 'BMAJULDMMES/Q0706S325',
    courseSlug: 'digital-marketing',
    courseName: 'Digital Marketing'
  },
  {
    name: 'Balachandar D.',
    certificateId: 'BMAJULDMMES/Q07065374',
    courseSlug: 'digital-marketing',
    courseName: 'Digital Marketing'
  },
  {
    name: 'Pratheekaran Ramakrishnan',
    certificateId: 'BMAJANDMMES/Q04065332',
    courseSlug: 'digital-marketing',
    courseName: 'Digital Marketing'
  }
];

// 2. New Students to Add (Needs Generated IDs)
const newStudents = [
  'Ashiquah',
  'Prakash Swaminathan',
  'Sudhakar',
  'Gopinath',
  'Niranjan',
  'Sathishkumar M',
  'priyaa.A',
  'Swetha N'
];

const run = async () => {
  try {
    log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    log('✅ MongoDB Connected');

    // Part 1: Fix/Add Specific Students
    log('\n--- Processing Specific Verification Fixes ---');
    for (const s of specificStudents) {
      log(`Checking ${s.name}...`);
      let existing = await CourseStudent.findOne({ certificateId: s.certificateId });
      
      if (!existing) {
        existing = await CourseStudent.findOne({ 
          name: { $regex: new RegExp(`^${s.name}$`, 'i') },
          courseSlug: s.courseSlug
        });
      }

      if (existing) {
        let updated = false;
        if (existing.certificateId !== s.certificateId) {
          log(`Updating ID: ${existing.certificateId} -> ${s.certificateId}`);
          existing.certificateId = s.certificateId;
          updated = true;
        }
        if (existing.name !== s.name) {
             log(`Updating Name: ${existing.name} -> ${s.name}`);
             existing.name = s.name;
             updated = true;
        }

        if (updated) {
          await existing.save();
          log(`✅ Updated: ${s.name}`);
        } else {
          log(`✨ Already Correct: ${s.name}`);
        }
      } else {
        await CourseStudent.create({
          name: s.name,
          courseName: s.courseName,
          courseSlug: s.courseSlug,
          certificateId: s.certificateId,
          isEligible: true,
          certificateSent: false
        });
        log(`✅ Created: ${s.name}`);
      }
    }

    // Part 2: Add New Students
    log('\n--- Adding New Students ---');
    
    // Find current max certificate number for BMADM format only
    const allStudents = await CourseStudent.find({ courseSlug: 'digital-marketing' });
    let maxNum = 0;
    
    for (const student of allStudents) {
      if (student.certificateId && student.certificateId.startsWith('BMADM')) {
        const numPart = student.certificateId.replace('BMADM', '');
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    
    log(`Highest BMADM ID: ${maxNum}`);
    
    let currentNum = maxNum;
    let addedCount = 0;

    for (const name of newStudents) {
      // Check if student exists
      const existingName = await CourseStudent.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        courseSlug: 'digital-marketing'
      });

      if (existingName) {
        log(`⏭️ Skipped (Exists): ${name} (${existingName.certificateId})`);
        continue;
      }

      currentNum++;
      const newCertId = `BMADM${String(currentNum).padStart(4, '0')}`;
      
      await CourseStudent.create({
        name: name,
        courseName: 'Digital Marketing',
        courseSlug: 'digital-marketing',
        certificateId: newCertId,
        isEligible: true,
        certificateSent: false
      });
      
      log(`✅ Added: ${name} -> ${newCertId}`);
      addedCount++;
    }

    const totalCount = await CourseStudent.countDocuments({ courseSlug: 'digital-marketing' });
    log(`\n---------------------------------`);
    log(`🎉 Process Complete`);
    log(`Added New: ${addedCount}`);
    log(`Total Students: ${totalCount}`);
    log(`---------------------------------`);

  } catch (err) {
    log(`❌ Error: ${err.message}`);
    log(err.stack);
  } finally {
    await mongoose.connection.close();
    log('Done.');
    process.exit(0);
  }
};

run();

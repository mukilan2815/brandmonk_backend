const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const LOG_FILE = path.join(__dirname, 'fix_output.txt');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(LOG_FILE, msg + '\n');
}

// Clear log
fs.writeFileSync(LOG_FILE, 'Starting Fix Script...\n');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

// Targeted Students
const students = [
  'Ashiquah',
  'Prakash Swaminathan',
  'Sudhakar',
  'Gopinath',
  'Niranjan',
  'Sathishkumar M',
  'priyaa.A',
  'Swetha N'
];

// ID Configuration
const PREFIX = 'BMAJUNDMMES/Q0506S';
const START_NUM = 54;

const run = async () => {
  try {
    log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    log('✅ MongoDB Connected');
    log('------------------------------------------------');

    let currentNum = START_NUM;

    for (const name of students) {
      // Find by name
      const student = await CourseStudent.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        courseSlug: 'digital-marketing'
      });

      if (student) {
        const newId = `${PREFIX}${String(currentNum).padStart(3, '0')}`;
        
        log(`Processing: ${student.name}`);
        log(`   Current ID: ${student.certificateId}`);
        log(`   Target ID : ${newId}`);

        if (student.certificateId !== newId) {
          student.certificateId = newId;
          await student.save();
          log(`   ✅ UPDATED successfully`);
        } else {
          log(`   ✨ Already Matches`);
        }
        
        // Validation Link
        log(`   Verify: https://brandmonkacademy.com/verify/${newId}`);
        log('------------------------------------------------');

        currentNum++;
      } else {
        log(`❌ NOT FOUND: ${name}`);
      }
    }

    const total = await CourseStudent.countDocuments({ courseSlug: 'digital-marketing' });
    log(`\nTotal Digital Marketing Students: ${total}`);
    
  } catch (err) {
    log(`❌ ERROR: ${err.message}`);
  } finally {
    await mongoose.connection.close();
    log('Done.');
    process.exit(0);
  }
};

run();

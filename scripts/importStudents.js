const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CourseStudent = require('../models/CourseStudent');
const connectDB = require('../config/db');

dotenv.config();

// Student data from your provided list
const STUDENTS_TO_IMPORT = [
  // Video Editing Students
  {
    name: 'Muhamad Jiyath E',
    phoneNumber: '8344110055',
    courseName: 'Video Editing',
    courseSlug: 'video-editing',
    batch: null,
    email: null
  },
  {
    name: 'N. Sathis Kumar',
    phoneNumber: '9940906061',
    courseName: 'Video Editing',
    courseSlug: 'video-editing',
    batch: 'VE/SEP 25/AK/06:30 PM/CBE/BMA',
    email: null
  },
  {
    name: 'Haridasan G',
    phoneNumber: '8695353531',
    courseName: 'Video Editing',
    courseSlug: 'video-editing',
    batch: null,
    email: null
  },
  {
    name: 'Asmath Nisha',
    phoneNumber: null,
    courseName: 'Video Editing',
    courseSlug: 'video-editing',
    batch: 'VL October Video Launchpad Community - 11:30 Batch',
    email: null
  },
  {
    name: 'Devaraj',
    phoneNumber: '9538619468',
    courseName: 'Video Editing',
    courseSlug: 'video-editing',
    batch: 'BMA',
    email: null
  },
  {
    name: 'Deenadhayalan K',
    phoneNumber: '6385469220',
    courseName: 'Video Editing',
    courseSlug: 'video-editing',
    batch: 'BMA/VE/OCT 25/BSSR/11.30AM/CBE',
    email: null
  },
  {
    name: 'K. Shalini',
    phoneNumber: '971543626121',
    courseName: 'Video Editing',
    courseSlug: 'video-editing',
    batch: 'BMA/VE/SEP 25/BS/11:30 AM/CBE',
    email: null
  },

  // Digital Marketing Students
  {
    name: 'Srimathi M',
    phoneNumber: '89401 34118',
    courseName: 'Digital Marketing',
    courseSlug: 'digital-marketing',
    batch: null,
    email: null
  },
  {
    name: 'Vinu G',
    phoneNumber: '8940134118',
    courseName: 'Digital Marketing',
    courseSlug: 'digital-marketing',
    batch: 'DM/NOV/25/6.30 PM',
    email: null
  },
  {
    name: 'S. Arunkumar',
    phoneNumber: '9500508147',
    courseName: 'Digital Marketing',
    courseSlug: 'digital-marketing',
    batch: 'DM/NOV 25/06:30 PM/BMA',
    email: null
  },
  {
    name: 'Arun Raja',
    phoneNumber: null,
    courseName: 'Digital Marketing',
    courseSlug: 'digital-marketing',
    batch: 'July Batch 2025',
    email: null
  }
];

async function importStudents() {
  try {
    console.log('🔍 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    console.log(`\n📚 Importing ${STUDENTS_TO_IMPORT.length} students...\n`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const studentData of STUDENTS_TO_IMPORT) {
      try {
        // Check if student already exists
        const existing = await CourseStudent.findOne({
          name: studentData.name.trim(),
          courseSlug: studentData.courseSlug.trim()
        });

        if (existing) {
          console.log(`⏭️  Skipped: ${studentData.name} (already exists)`);
          skipCount++;
          continue;
        }

        // Generate certificate ID
        const count = await CourseStudent.countDocuments({
          courseSlug: studentData.courseSlug
        });
        const prefixMap = {
          'video-editing': 'BMAVE',
          'digital-marketing': 'BMADM'
        };
        const prefix = prefixMap[studentData.courseSlug] || 'BMA';
        const certificateId = `${prefix}${(count + 1).toString().padStart(5, '0')}`;

        // Create student
        const student = new CourseStudent({
          ...studentData,
          certificateId,
          isEligible: true,
          dateOfRegistration: new Date()
        });

        const saved = await student.save();

        console.log(`✅ Created: ${studentData.name}`);
        console.log(`   Certificate ID: ${certificateId}`);
        console.log(`   Course: ${studentData.courseName}\n`);

        successCount++;
      } catch (error) {
        console.error(`❌ Failed: ${studentData.name}`);
        console.error(`   Error: ${error.message}\n`);
        failCount++;
      }
    }

    console.log('\n========================================');
    console.log('📊 Import Summary');
    console.log('========================================');
    console.log(`✅ Created: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total: ${STUDENTS_TO_IMPORT.length}`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importStudents();

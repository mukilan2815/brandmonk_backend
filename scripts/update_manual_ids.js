const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
require('dotenv').config();

// Use URI from env or fallback
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

const studentsToUpdate = [
  'Ashiquah',
  'Prakash Swaminathan',
  'Sudhakar',
  'Gopinath',
  'Niranjan',
  'Sathishkumar M',
  'priyaa.A',
  'Swetha N'
];

// Starting ID number based on Tharun being 053 -> Next is 054
const START_ID = 54;
const ID_PREFIX = 'BMAJUNDMMES/Q0506S';

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected\n');
    console.log('--- Updating Student IDs to Specific Range ---');

    let currentIdNum = START_ID;

    for (const name of studentsToUpdate) {
      // Find the student (they likely have a BMADM... ID now)
      const student = await CourseStudent.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        courseSlug: 'digital-marketing'
      });

      if (student) {
        // Construct the new ID: BMAJUNDMMES/Q0506S054
        const newCertId = `${ID_PREFIX}${String(currentIdNum).padStart(3, '0')}`;
        
        if (student.certificateId !== newCertId) {
          console.log(`Updating ${student.name}:`);
          console.log(`   Old: ${student.certificateId}`);
          console.log(`   New: ${newCertId}`);
          
          student.certificateId = newCertId;
          await student.save();
          console.log(`   ✅ Success`);
        } else {
          console.log(`✨ ${student.name} is already ${newCertId}`);
        }
        
        currentIdNum++;
      } else {
        console.log(`❌ Could not find student: ${name}`);
      }
    }
    
    console.log('\n--- Final Verification ---');
    const total = await CourseStudent.countDocuments({ courseSlug: 'digital-marketing' });
    console.log(`Total Digital Marketing Students: ${total}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
};

run();

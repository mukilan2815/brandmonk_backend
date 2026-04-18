const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const verifyStudents = async () => {
  await connectDB();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Verifying Students by Course');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check Digital Marketing students
  const dmStudents = await CourseStudent.find({ courseSlug: 'digital-marketing' });
  console.log(`Digital Marketing Total: ${dmStudents.length}\n`);
  
  // Show the newly added ones
  const newDMStudents = dmStudents.filter(s => 
    ['RAKESH KUMAR.C', 'S.H.MALICK FIRDHOUSE', 'Vanmathi Ramasubramanian', 
     'Aabi Shankari Karunamoorthi', 'Kokila.M.S', 'Bhaheerathi S', 
     'Ashiquah S', 'Aruna P', 'Sirajudeen N', 'Haripriya P'].includes(s.name)
  );
  
  if (newDMStudents.length > 0) {
    console.log('✅ New DM Students Found:');
    newDMStudents.forEach(s => {
      console.log(`  - ${s.name} (${s.certificateId})`);
    });
  } else {
    console.log('❌ New DM Students NOT found!');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check Video Editing students
  const veStudents = await CourseStudent.find({ courseSlug: 'video-editing' });
  console.log(`Video Editing Total: ${veStudents.length}\n`);

  // Show the newly added ones
  const newVEStudents = veStudents.filter(s =>
    ['Omprakash S', 'Badmavathi B', 'R.M.Deepika', 'Karthi R', 'Ashaz Ahmed R',
     'Saran.A', 'Marimuthu P', 'nivya', 'jayaraj'].includes(s.name)
  );

  if (newVEStudents.length > 0) {
    console.log('✅ New VE Students Found:');
    newVEStudents.forEach(s => {
      console.log(`  - ${s.name} (${s.certificateId})`);
    });
  } else {
    console.log('❌ New VE Students NOT found!');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.connection.close();
  process.exit(0);
};

verifyStudents().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

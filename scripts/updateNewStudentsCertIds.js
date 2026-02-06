const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
require('dotenv').config();

// Update certificate IDs for the 3 new students
const updates = [
  { oldId: 'BMADM0001', newId: 'BMAJUNDMMES/Q0506S050', name: 'Sakthikumaran M' },
  { oldId: 'BMADM0002', newId: 'BMAJUNDMMES/Q0506S051', name: 'SASIKALA J' },
  { oldId: 'BMADM0003', newId: 'BMAJUNDMMES/Q0506S052', name: 'nivethitha s' }
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Updating Certificate IDs to proper format');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const update of updates) {
    const result = await CourseStudent.findOneAndUpdate(
      { certificateId: update.oldId },
      { certificateId: update.newId },
      { new: true }
    );
    
    if (result) {
      console.log(`✅ ${result.name}`);
      console.log(`   Old ID: ${update.oldId}`);
      console.log(`   New ID: ${update.newId}`);
      console.log(`   Verify: https://brandmonkacademy.com/verify/${update.newId}`);
      console.log('');
    } else {
      console.log(`❌ Not found: ${update.name} (${update.oldId})`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('DONE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  process.exit(0);
});

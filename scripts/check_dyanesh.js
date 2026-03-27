const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
const MONGO_URI = 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

mongoose.connect(MONGO_URI).then(async () => {
  const s1 = await CourseStudent.findOne({ certificateId: 'BMAJULDMES/Q0706S378' });
  const s2 = await CourseStudent.findOne({ name: { $regex: /dyanesh/i } });
  const s3 = await CourseStudent.findOne({ certificateId: 'BMAJULDMMES/Q0706S378' });

  console.log('By ID (BMAJULDMES - missing M):', s1 ? s1.name + ' | ' + s1.certificateId : 'NOT FOUND');
  console.log('By name (Dyanesh):            ', s2 ? s2.name + ' | ' + s2.certificateId : 'NOT FOUND');
  console.log('By ID (BMAJULDMMES - correct):', s3 ? s3.name + ' | ' + s3.certificateId : 'NOT FOUND');
  mongoose.connection.close();
});

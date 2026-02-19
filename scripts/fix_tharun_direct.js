const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');

const MONGO_URI = 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

const fixTharun = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected');

    const name = 'B.THARUN';
    const finalCertId = 'BMAJUNDMMES/Q0506S053';

    // Find student
    const student = await CourseStudent.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      courseSlug: 'digital-marketing'
    });

    if (student) {
      console.log(`Found student: ${student.name}`);
      console.log(`Current ID: ${student.certificateId}`);

      student.certificateId = finalCertId;
      student.name = 'B.THARUN'; // Ensure exact casing
      await student.save();
      console.log(`✅ Updated certificate ID to: ${finalCertId}`);
      console.log(`Verify URL: https://brandmonkacademy.com/verify/${finalCertId}`);
    } else {
      console.log(`❌ Student ${name} not found. Creating him now...`);
      
      const newStudent = new CourseStudent({
        name: 'B.THARUN',
        courseName: 'Digital Marketing',
        courseSlug: 'digital-marketing',
        certificateId: finalCertId,
        isEligible: true,
        certificateSent: false,
        dateOfRegistration: new Date()
      });

      await newStudent.save();
      console.log(`✅ Created student with ID: ${finalCertId}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
};

fixTharun();

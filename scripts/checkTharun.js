const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');

// Hardcoded URI to avoid dotenv issues in this specific script
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
      console.log(`\nFound student: ${student.name}`);
      console.log(`Current ID: ${student.certificateId}`);

      if (student.certificateId !== finalCertId) {
        student.certificateId = finalCertId;
        student.name = 'B.THARUN'; // Update casing if needed
        await student.save();
        console.log(`✅ Updated certificate ID to: ${finalCertId}`);
      } else {
        console.log(`✅ Certificate ID is already correct: ${finalCertId}`);
      }
      console.log(`Verify URL: https://brandmonkacademy.com/verify/${finalCertId}`);
    } else {
      console.log(`\n❌ Student ${name} not found.`);
      console.log('Creating student record now...');
      
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
      console.log(`Verify URL: https://brandmonkacademy.com/verify/${finalCertId}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
};

fixTharun();

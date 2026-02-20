const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');

// Use the URI from the working script
const MONGO_URI = 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

const studentsToAdd = [
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
  },
  {
    name: "S.SENTAMILSELVI",
    certificateId: "BMAJANDMMES/Q0406S776",
    courseSlug: 'digital-marketing',
    courseName: 'Digital Marketing'
  }
];

const addStudents = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected');

    for (const studentData of studentsToAdd) {
      console.log(`\nProcessing ${studentData.name}...`);
      
      // Try to find by certificate ID first, then by name
      let student = await CourseStudent.findOne({ 
        certificateId: studentData.certificateId 
      });

      if (!student) {
        student = await CourseStudent.findOne({ 
          name: { $regex: new RegExp(`^${studentData.name}$`, 'i') },
          courseSlug: studentData.courseSlug
        });
      }

      if (student) {
        console.log(`Found existing student: ${student.name} (${student.certificateId})`);
        
        // Update details if needed
        let updated = false;
        if (student.certificateId !== studentData.certificateId) {
          console.log(`Updating Certificate ID from ${student.certificateId} to ${studentData.certificateId}`);
          student.certificateId = studentData.certificateId;
          updated = true;
        }
        
        // Ensure name matches exactly what was requested (optional, but good for consistency)
        if (student.name !== studentData.name) {
             console.log(`Updating Name from ${student.name} to ${studentData.name}`);
             student.name = studentData.name;
             updated = true;
        }

        if (updated) {
          await student.save();
          console.log(`✅ Updated successfully`);
        } else {
          console.log(`No changes needed.`);
        }
        
      } else {
        console.log(`Student not found. Creating new record...`);
        const newStudent = new CourseStudent({
          name: studentData.name,
          courseName: studentData.courseName,
          courseSlug: studentData.courseSlug,
          certificateId: studentData.certificateId,
          isEligible: true,
          certificateSent: false,
          dateOfRegistration: new Date()
        });

        await newStudent.save();
        console.log(`✅ Created student: ${studentData.name} with ID: ${studentData.certificateId}`);
      }
      
      console.log(`Verify URL: https://brandmonkacademy.com/verify/${studentData.certificateId}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\nDone.');
  }
};

addStudents();

const mongoose = require('mongoose');
const Student = require('../models/Student');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const removeAllCourseStudents = async () => {
    await connectDB();

    console.log('Removing all students from Digital Marketing and Video Editing courses...');
    console.log('(Webinar students will NOT be affected)');
    console.log('');

    // Delete students that have webinarSlug for our courses
    const dmResult = await Student.deleteMany({ 
        $or: [
            { webinarSlug: 'digital-marketing' },
            { webinarName: 'Digital Marketing' }
        ]
    });
    console.log(`Digital Marketing: ${dmResult.deletedCount} students removed`);

    const veResult = await Student.deleteMany({ 
        $or: [
            { webinarSlug: 'video-editing' },
            { webinarName: 'Video Editing' }
        ]
    });
    console.log(`Video Editing: ${veResult.deletedCount} students removed`);

    console.log('');
    console.log('Course students removal complete.');
    console.log('Webinar students are untouched.');
    
    process.exit();
};

removeAllCourseStudents();

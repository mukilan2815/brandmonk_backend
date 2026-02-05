const mongoose = require('mongoose');
const Student = require('../models/Student');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const cleanupDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Delete all students with bad certificate IDs (longer than expected format)
        const result = await Student.deleteMany({
            certificateId: { $regex: /^SMAPARMQ076[0-9]{4,}$/ } // 4+ digits (should only be 3)
        });

        console.log(`Deleted ${result.deletedCount} students with corrupted certificate IDs`);
        
        // Delete all Digital Marketing and Video Editing students to start fresh
        const dmResult = await Student.deleteMany({ webinarSlug: 'digital-marketing' });
        const veResult = await Student.deleteMany({ webinarSlug: 'video-editing' });
        
        console.log(`Deleted ${dmResult.deletedCount} Digital Marketing students`);
        console.log(`Deleted ${veResult.deletedCount} Video Editing students`);
        
        console.log('Cleanup Complete');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

cleanupDB();

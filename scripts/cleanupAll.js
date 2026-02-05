const mongoose = require('mongoose');
const Student = require('../models/Student');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const cleanupAll = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Delete ALL Digital Marketing and Video Editing students
        const result = await Student.deleteMany({ 
            $or: [
                { webinarSlug: 'digital-marketing' },
                { webinarSlug: 'video-editing' },
                { webinarName: 'Digital Marketing' },
                { webinarName: 'Video Editing' }
            ]
        });
        
        console.log(`Deleted ${result.deletedCount} all DM and VE students`);
        console.log('Cleanup Complete - Ready for fresh seed');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

cleanupAll();

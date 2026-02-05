const mongoose = require('mongoose');
const Student = require('../models/Student');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const cleanupVE = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Delete all Video Editing students (old ones)
        const result = await Student.deleteMany({ 
            $or: [
                { webinarSlug: 'video-editing' },
                { webinarName: 'Video Editing' }
            ]
        });
        
        console.log(`Deleted ${result.deletedCount} old Video Editing students`);
        console.log('Cleanup Complete');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

cleanupVE();

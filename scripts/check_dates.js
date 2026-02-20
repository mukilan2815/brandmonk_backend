const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

const CourseStudent = require('../models/CourseStudent');

async function checkDates() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // Check Payal's date
        const payal = await CourseStudent.findOne({ name: "Payal D Goklani" });
        if (payal) {
            console.log(`\nPayal D Goklani:`);
            console.log(`Certificate ID: ${payal.certificateId}`);
            console.log(`Date of Registration: ${payal.dateOfRegistration}`);
            console.log(`Created At: ${payal.createdAt}`);
        }

        // Check a few others with similar ID pattern (JUL)
        console.log('\n--- Other July Students ---');
        const others = await CourseStudent.find({ 
            certificateId: { $regex: 'BMAJULDMMES' },
            name: { $ne: "Payal D Goklani" }
        }).limit(3);

        others.forEach(s => {
            console.log(`${s.name}: ${s.certificateId} -> ${s.dateOfRegistration}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

checkDates();

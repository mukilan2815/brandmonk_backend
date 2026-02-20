const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

const CourseStudent = require('../models/CourseStudent');

async function debugStudents() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        console.log('\n--- Searching for Payal ---');
        const payals = await CourseStudent.find({ name: { $regex: /Payal/i } });
        payals.forEach(p => {
            console.log(`Name: "${p.name}"`);
            console.log(`ID: ${p.certificateId}`);
            console.log(`Date: ${p.dateOfRegistration}`);
            console.log(`Slug: ${p.courseSlug}`);
            console.log('----------------');
        });

        console.log('\n--- Searching for Balachandar ---');
        const balas = await CourseStudent.find({ name: { $regex: /Balachandar/i } });
        balas.forEach(p => {
            console.log(`Name: "${p.name}"`);
            console.log(`ID: ${p.certificateId}`);
            console.log('----------------');
        });

        console.log('\n--- Searching for Senthamilselvi ---');
        // Search loosely to catch spelling variations
        const senthas = await CourseStudent.find({ 
            $or: [
                { name: { $regex: /Sentamil/i } },
                { name: { $regex: /Senthamil/i } }
            ]
        });
        senthas.forEach(p => {
            console.log(`Name: "${p.name}"`);
            console.log(`ID: ${p.certificateId}`);
            console.log('----------------');
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

debugStudents();

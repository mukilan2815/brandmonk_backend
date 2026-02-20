const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CourseStudent = require('../models/CourseStudent');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

const updates = [
    {
        namePattern: "Balachandar",
        // Updating to S374 as requested
        targetId: "BMAJULDMMES/Q0706S374"
    },
    {
        namePattern: "S.SENTAMILSELVI", 
        // Ensuring this ID is set
        targetId: "BMAJANDMMES/Q0406S776"
    }
];

async function updateIds() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected');

        for (const update of updates) {
            console.log(`\nProcessing ${update.namePattern}...`);
            const student = await CourseStudent.findOne({ 
                name: { $regex: new RegExp(update.namePattern, 'i') } 
            });

            if (student) {
                console.log(`Found: ${student.name}`);
                console.log(`Old ID: ${student.certificateId}`);
                if (student.certificateId !== update.targetId) {
                    student.certificateId = update.targetId;
                    await student.save();
                    console.log(`✅ Updated to: ${student.certificateId}`);
                } else {
                    console.log(`✓ ID already matches`);
                }
            } else {
                console.log(`❌ Student not found!`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

updateIds();

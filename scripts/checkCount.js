const mongoose = require('mongoose');
const Student = require('../models/Student');
require('dotenv').config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await Student.countDocuments();
        console.log(`Total Students in DB: ${count}`);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
check();

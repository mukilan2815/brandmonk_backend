const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

const students = [
  'Ashiquah',
  'Prakash Swaminathan',
  'Sudhakar',
  'Gopinath',
  'Niranjan',
  'Sathishkumar M',
  'priyaa.A',
  'Swetha N'
];

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('\n✅ Connected to DB');
    console.log('----------------------------------------------------------------');
    console.log(' CONFIRMED VERIFICATION LINKS (Use these links)');
    console.log('----------------------------------------------------------------');

    for (const name of students) {
        const s = await CourseStudent.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') }, 
            courseSlug: 'digital-marketing' 
        });
        
        if (s) {
            console.log(`Student: ${s.name}`);
            console.log(`ID     : ${s.certificateId}`);
            // Use /verify/course/ path as requested/verified by user
            console.log(`URL    : https://brand-monk.vercel.app/verify/course/${s.certificateId}`);
            console.log('----------------------------------------------------------------');
        } else {
            console.log(`❌ Not Found: ${name}`);
        }
    }
  } catch (err) {
    console.log(err);
  } finally {
    await mongoose.connection.close();
  }
};

run();

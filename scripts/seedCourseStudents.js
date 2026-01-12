const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
require('dotenv').config();

const veNamesRaw = `
SURYA A
M. SABEERA BANU 
M.Akash
Saran S
Mohammed Aasif Iqbal S A
KISHORE G
Suveitha R
JEEVA. M
vinoth vijayakumar
Revathi Subramaniyam
M.A.KAVINILAVU
J.Lakshmanan
Sakthikumar
G.SUJIKUMARI
Sabareesan Ponnuvel
G.Vaishnavi
ARUN PRASATH S 
Hemarangan G
M.Akash
vinoth vijayakumar
Prabakaran S
Lokesh S
Srikanth.s
N.Mahalakshmi
Jayashree Y
Saraswathi M
Jabaraj j
Sivasangari P 
Mohammed Aasif Iqbal S A 
M.Akash
Suveitha R
Srikanth.s
Jabaraj J
N. Mahalakshmi
Sakthikumar K.G
ARUN PRASATH S
Poovarasan Murugesan 
Monisha Valli M V 
J.Lakshnanan
Lokesh S
M.A.KAVINILAVU
Surya Narayanan 
KARTHIK C
M.A.KAVINILAVU
Lokesh S
THIKA P
Bindhu N
Mugilarasu G
SIKENDAR BASHA M
Vishnusithan A
G.Vaishnavi
Vishnusithan A
Vidhyambigai S
THIKA P
`;

const cleanNames = (text) => {
  return text.split('\n')
    .map(n => n.trim())
    .filter(n => n && n.length > 0);
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const seedCourseStudents = async () => {
    await connectDB();

    const names = cleanNames(veNamesRaw);
    console.log(`Found ${names.length} Video Editing students to add...`);

    // Clear existing Video Editing course students
    const deleteResult = await CourseStudent.deleteMany({ courseSlug: 'video-editing' });
    console.log(`Cleared ${deleteResult.deletedCount} existing Video Editing course students.`);

    let addedCount = 0;
    let certNum = 1;

    for (const name of names) {
        // Generate unique certificate ID
        const certificateId = `BMAVE${certNum.toString().padStart(4, '0')}`;
        certNum++;

        const student = new CourseStudent({
            name: name,
            courseName: 'Video Editing',
            courseSlug: 'video-editing',
            certificateId: certificateId,
            isEligible: true,
            certificateSent: false,
            dateOfRegistration: new Date()
        });

        await student.save();
        addedCount++;

        if (addedCount % 10 === 0) {
            console.log(`Added ${addedCount} students...`);
        }
    }

    console.log(`\nSuccessfully added ${addedCount} Video Editing course students.`);
    console.log('Webinar students are NOT affected.');
    
    process.exit();
};

seedCourseStudents();

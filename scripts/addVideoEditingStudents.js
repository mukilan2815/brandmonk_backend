const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CourseStudent = require('../models/CourseStudent');

dotenv.config();

const students = [
  { name: "SURYA A", certificateId: "BMANOVVEMES/Q1401S05" },
  { name: "M. SABEERA BANU", certificateId: "BMAJANVEMES/Q1401S20" },
  { name: "SARAN S", certificateId: "BMAJUNVEMES/Q1401S108" },
  { name: "KISHORE G", certificateId: "BMAJUNVEMES/Q1401S127" },
  { name: "JEEVA. M", certificateId: "BMAJUNVEMES/Q1401S101" },
  { name: "REVATHI SUBRAMANIYAM", certificateId: "BMAJUNVEMES/Q1401S133" },
  { name: "G.SUJIKUMARI", certificateId: "BMAJUNVEMES/Q1401S104" },
  { name: "SABAREESAN PONNUVEL", certificateId: "BMANOVVEMES/Q1401S12" },
  { name: "HEMARANGAN G", certificateId: "BMAJUNVEMES/Q1401S122" },
  { name: "M.AKASH", certificateId: "BMAJUNVEMES/Q1401S125" },
  { name: "VINOTH VIJAYAKUMAR", certificateId: "BMAJUNVEMES/Q1401S114" },
  { name: "PRABAKARAN S", certificateId: "BMAJUNVEMES/Q1401S116" },
  { name: "N.MAHALAKSHMI", certificateId: "BMAJANVEMES/Q1401S23" },
  { name: "JAYASHREE Y", certificateId: "BMAJANVEMES/Q1401S25" },
  { name: "SARASWATHI M", certificateId: "BMAJUNVEMES/Q1401S134" },
  { name: "SIVASANGARI P", certificateId: "BMAJUNVEMES/Q1401S130" },
  { name: "MOHAMMED AASIF IQBAL S A", certificateId: "BMAJANVEMES/Q1401S39" },
  { name: "SUVEITHA R", certificateId: "BMAJUNVEMES/Q1401S112" },
  { name: "SRIKANTH.S", certificateId: "BMAJUNVEMES/Q1401S93" },
  { name: "JABARAJ J", certificateId: "BMAJUNVEMES/Q1401S99" },
  { name: "SAKTHIKUMAR K.G", certificateId: "BMAJUNVEMES/Q1401S107" },
  { name: "ARUN PRASATH S", certificateId: "BMAMARVEMES/Q1401S64" },
  { name: "POOVARASAN MURUGESAN", certificateId: "BMAJUNVEMES/Q1401S132" },
  { name: "MONISHA VALLI M V", certificateId: "BMAFEBVEMES/Q1401S31" },
  { name: "J.LAKSHNANAN", certificateId: "BMAJUNVEMES/Q1401S103" },
  { name: "SURYA NARAYANAN", certificateId: "BMAJUNVEMES/Q1401S110" },
  { name: "KARTHIK C", certificateId: "BMAMARVEMES/Q1401S55" },
  { name: "M.A.KAVINILAVU", certificateId: "BMAJUNVEMES/Q1401S102" },
  { name: "LOKESH S", certificateId: "BMAJUNVEMES/Q1401S117" },
  { name: "G.VAISHNAVI", certificateId: "BMAJUNVEMES/Q1401S113" },
  { name: "THIKA P", certificateId: "BMAJUNVEMES/Q1401S129" }
];

async function addVideoEditingStudents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let added = 0;
    let skipped = 0;
    let updated = 0;

    for (const student of students) {
      try {
        // Check if student already exists by certificate ID
        const existing = await CourseStudent.findOne({ 
          certificateId: student.certificateId 
        });

        if (existing) {
          // Update the name if it's different
          if (existing.name !== student.name.trim()) {
            existing.name = student.name.trim();
            await existing.save();
            console.log(`🔄 Updated: ${student.name} (${student.certificateId})`);
            updated++;
          } else {
            console.log(`⏭️  Skipped (exists): ${student.name} (${student.certificateId})`);
            skipped++;
          }
        } else {
          // Add new student
          const newStudent = new CourseStudent({
            name: student.name.trim(),
            courseName: 'Advanced Video Editing (AI-Integrated)',
            courseSlug: 'video-editing',
            certificateId: student.certificateId,
            isEligible: true,
            certificateSent: false,
            dateOfRegistration: new Date()
          });

          await newStudent.save();
          console.log(`✅ Added: ${student.name} (${student.certificateId})`);
          added++;
        }
      } catch (err) {
        console.error(`❌ Error processing ${student.name}:`, err.message);
      }
    }

    console.log('\n========================================');
    console.log('📊 SUMMARY');
    console.log('========================================');
    console.log(`✅ Added: ${added}`);
    console.log(`🔄 Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📝 Total Processed: ${students.length}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

addVideoEditingStudents();

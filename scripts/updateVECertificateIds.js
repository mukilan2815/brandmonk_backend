const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CourseStudent = require('../models/CourseStudent');

dotenv.config();

// Mapping of student names to their correct certificate IDs
const studentCertificateMapping = [
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

// Helper function to normalize names for comparison
function normalizeName(name) {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
    .replace(/,/g, '');
}

async function updateCertificateIds() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all Video Editing students
    const allStudents = await CourseStudent.find({ 
      courseSlug: 'video-editing' 
    });

    console.log(`\n📊 Found ${allStudents.length} Video Editing students in database\n`);

    let updated = 0;
    let notFound = 0;
    let alreadyCorrect = 0;

    for (const mapping of studentCertificateMapping) {
      const normalizedMappingName = normalizeName(mapping.name);
      
      // Try to find the student by exact name match first
      let student = allStudents.find(s => 
        normalizeName(s.name) === normalizedMappingName
      );

      // If not found, try partial match
      if (!student) {
        student = allStudents.find(s => {
          const normalizedDbName = normalizeName(s.name);
          return normalizedDbName.includes(normalizedMappingName) || 
                 normalizedMappingName.includes(normalizedDbName);
        });
      }

      if (student) {
        if (student.certificateId === mapping.certificateId) {
          console.log(`✓ Already correct: ${student.name} → ${mapping.certificateId}`);
          alreadyCorrect++;
        } else {
          const oldId = student.certificateId;
          student.certificateId = mapping.certificateId;
          await student.save();
          console.log(`🔄 Updated: ${student.name}`);
          console.log(`   Old ID: ${oldId}`);
          console.log(`   New ID: ${mapping.certificateId}`);
          updated++;
        }
      } else {
        console.log(`❌ Not found in database: ${mapping.name}`);
        notFound++;
      }
    }

    console.log('\n========================================');
    console.log('📊 SUMMARY');
    console.log('========================================');
    console.log(`🔄 Updated: ${updated}`);
    console.log(`✓ Already Correct: ${alreadyCorrect}`);
    console.log(`❌ Not Found: ${notFound}`);
    console.log(`📝 Total in List: ${studentCertificateMapping.length}`);
    console.log('========================================\n');

    if (notFound > 0) {
      console.log('⚠️  Students not found in database:');
      console.log('These students may need to be added manually or their names might be different in the database.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

updateCertificateIds();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CourseStudent = require('../models/CourseStudent');

dotenv.config();

// Complete list of valid Digital Marketing students (144 total)
const validCertificateIds = [
  "BMAJUNDMMES/Q0706S04", "BMAJUNDMMES/Q0706S51", "BMAJUNDMMES/Q0706S29", "BMAJUNDMMES/Q0706S307",
  "BMAJANDMMES/Q0406S605", "BMAMARDMMES/Q0706S219", "BMAJANDMMES/Q0406S491", "BMADECDMMES/Q0706S111",
  "BMAAPRDMMES/Q0706S250", "BMANOVDMMES/Q0706S94", "BMAFEBDMMES/Q0706S146", "BMAFEBDMMES/Q0706S154",
  "BMADECDMMES/Q0706S113", "BMAJULDMMES/Q0706S353", "BMAAPRDMMES/Q0706S231", "BMAAPRDMMES/Q0706S249",
  "BMAJANDMMES/Q0406S291", "BMAFEBDMMES/Q0706S195", "BMAMAYDMMES/Q0706S261", "BMAJUNDMMES/Q0706S320",
  "BMAJANDMMES/Q0706S136", "BMAJULDMMES/Q0706S340", "BMAJULDMMES/Q0706S362", "BMAJANDMMES/Q0406S120",
  "BMAJANDMMES/Q0406S443", "BMADECDMMES/Q0706S109", "BMAFEBDMMES/Q0706S224", "BMAMAYDMMES/Q0706S271",
  "BMAMAYDMMES/Q0706S290", "BMAMARDMMES/Q0706S222", "BMAJULDMMES/Q0706S325", "BMADECDMMES/Q0706S110",
  "BMADECDMMES/Q0706S100", "BMAOCTDMMES/Q0706S83", "BMAMAYDMMES/Q0706S273", "BMAAPRDMMES/Q0706S233",
  "BMAJANDMMES/Q0406S885", "BMAMARDMMES/Q0706S210", "BMAFEBDMMES/Q0706S200", "BMAMAYDMMES/Q0706S287",
  "BMAAPRDMMES/Q0706S244", "BMAJANDMMES/Q0406S994", "BMAFEBDMMES/Q0706S178", "BMAJULDMMES/Q0706S329",
  "BMAJANDMMES/Q0406S668", "BMAJUNDMMES/Q0706S35", "BMAJANDMMES/Q0406S210", "BMAJANDMMES/Q0406S811",
  "BMAJANDMMES/Q0406S539", "BMAJANDMMES/Q0406S137", "BMAJANDMMES/Q0406S729", "BMAJANDMMES/Q0406S524",
  "BMAJANDMMES/Q0406S417", "BMAJANDMMES/Q0406S945", "BMAJANDMMES/Q0406S208", "BMAJANDMMES/Q0406S100",
  "BMAJANDMMES/Q0406S368", "BMAJANDMMES/Q0406S635", "BMAJANDMMES/Q0406S776", "BMAJANDMMES/Q0406S260",
  "BMAJANDMMES/Q0406S202", "BMAAPRDMMES/Q0706S124", "BMAJANDMMES/Q0406S674", "BMAJANDMMES/Q0406S767",
  "BMAJULDMMES/Q0706S376", "BMAMAYDMMES/Q0706S259", "BMAJUNDMMES/Q0706S311", "BMAJULDMMES/Q0706S337",
  "BMAJULDMMES/Q0706S378", "BMAJANDMMES/Q0406S692", "BMAJANDMMES/Q0706S141", "BMAJULDMMES/Q0706S334",
  "BMAMAYDMMES/Q0706S286", "BMAJANDMMES/Q0406S206", "BMAJANDMMES/Q0406S360", "BMAJANDMMES/Q0406S440",
  "BMAJULDMMES/Q0706S365", "BMAMAYDMMES/Q0706S256", "BMAFEBDMMES/Q0706S186", "BMAJUNDMMES/Q0706S10",
  "BMAMARDMMES/Q0706S204", "BMAMAYDMMES/Q0706S284", "BMAJULDMMES/Q0706S359", "BMAJUNDMMES/Q0706S305",
  "BMAJULDMMES/Q0706S352", "BMAJULDMMES/Q0706S374", "BMAMARDMMES/Q0706S223", "BMAOCTDMMES/Q0706S501",
  "BMASEPDMMES/Q0706S422", "BMAMAYDMMES/Q0706S272", "BMAJANDMMES/Q0406S596", "BMAMAYDMMES/Q0706S282",
  "BMAJANDMMES/Q0406S978", "BMAJANDMMES/Q0406S812", "BMAFEBDMMES/Q0706S190", "BMAJULDMMES/Q0706S355",
  "BMAAUGDMMES/Q0706S401", "BMAAUGDMMES/Q0706S396", "BMASEPDMMES/Q0706S414", "BMAJULDMMES/Q0706S380",
  "BMASEPDMMES/Q0706S413", "BMAJANDMMES/Q0406S185", "BMAJANDMMES/Q0406S190", "BMAJANDMMES/Q0406S133",
  "BMAJANDMMES/Q0406S673", "BMAJANDMMES/Q0406S879", "BMAJANDMMES/Q0406S332", "BMAJANDMMES/Q0406S151",
  "BMAJANDMMES/Q0406S198", "BMAJANDMMES/Q0406S383", "BMAJANDMMES/Q0406S820", "BMAJANDMMES/Q0406S412",
  "BMAJANDMMES/Q0406S364", "BMAJANDMMES/Q0406S184", "BMAJANDMMES/Q0406S290", "BMAJANDMMES/Q0406S735",
  "BMAJANDMMES/Q0406S968", "BMAJANDMMES/Q0406S519", "BMAJANDMMES/Q0406S869", "BMAJANDMMES/Q0406S312",
  "BMAJANDMMES/Q0406S525", "BMAJANDMMES/Q0406S344", "BMAJANDMMES/Q0406S458", "BMAJANDMMES/Q0406S695",
  "BMAJANDMMES/Q0406S213", "BMAJANDMMES/Q0406S808", "BMAJANDMMES/Q0406S165", "BMAJANDMMES/Q0406S282",
  "BMAJANDMMES/Q0406S950", "BMAJANDMMES/Q0406S161", "BMAJANDMMES/Q0406S350", "BMAJANDMMES/Q0406S158",
  "BMAJANDMMES/Q0406S657", "BMAJANDMMES/Q0406S691", "BMAJUNDMMES/Q0706S313", "BMAJANDMMES/Q0406S969",
  "BMAJANDMMES/Q0406S392", "BMAJANDMMES/Q0406S175", "BMAJANDMMES/Q0406S972", "BMAJANDMMES/Q0406S288",
  "BMAJANDMMES/Q0406S636", "BMAJANDMMES/Q0406S908", "BMAJANDMMES/Q0406S914", "BMAJANDMMES/Q0406S841",
  "BMAJANDMMES/Q0406S442"
];

async function cleanupDMStudents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all Digital Marketing students
    const allDMStudents = await CourseStudent.find({ 
      courseSlug: 'digital-marketing' 
    });

    console.log(`📊 Found ${allDMStudents.length} Digital Marketing students in database\n`);

    // Separate valid and invalid students
    const validStudents = allDMStudents.filter(s => 
      validCertificateIds.includes(s.certificateId)
    );

    const invalidStudents = allDMStudents.filter(s => 
      !validCertificateIds.includes(s.certificateId)
    );

    console.log(`✅ Valid students (to keep): ${validStudents.length}`);
    console.log(`❌ Invalid students (to delete): ${invalidStudents.length}\n`);

    if (invalidStudents.length > 0) {
      console.log('🗑️  Students to be DELETED:');
      console.log('==========================================');
      invalidStudents.forEach(s => {
        console.log(`   ${s.name} → ${s.certificateId}`);
      });
      console.log('');

      // Delete invalid students
      const deleteResult = await CourseStudent.deleteMany({
        courseSlug: 'digital-marketing',
        certificateId: { $nin: validCertificateIds }
      });

      console.log(`\n🗑️  Deleted ${deleteResult.deletedCount} invalid students\n`);
    } else {
      console.log('✅ No invalid students found. Database is clean!\n');
    }

    // Verify final count
    const finalCount = await CourseStudent.countDocuments({ 
      courseSlug: 'digital-marketing' 
    });

    console.log('========================================');
    console.log('📊 FINAL SUMMARY');
    console.log('========================================');
    console.log(`✅ Total Digital Marketing students: ${finalCount}`);
    console.log(`📝 Expected: 144 students`);
    console.log(`${finalCount === 144 ? '✅' : '⚠️'} Status: ${finalCount === 144 ? 'Perfect!' : 'Check needed'}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

cleanupDMStudents();

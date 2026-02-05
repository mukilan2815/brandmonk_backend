const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CourseStudent = require('../models/CourseStudent');

dotenv.config();

// New Digital Marketing students - February 2026
const dmStudentsRaw = `
NIKHIL KUMAR B
Haravindh G
Sneha S
Yogeshwaran R
Abinaya V 
Shalini Sivasubramaniam 
Barath Navin B
Sathish Kumar.s
Vimala
Sarulatha M
PRIYADHARSHINI M 
SARAVANAN J
Sirmathi M
SAMRAJ . T
Ajitha C S
S.J ADARSH RAMAJAYAN
Praveen k
Sheeba Helan Glory .C.S
Peter Jeevanandam
Vanitha. S
Amuthamalar.R
V. JANARTHANAN
Thirunavukkarasu M
Balaji R
Selvaraj
Sudha. C
Poornima S
M RUBINIKA 
Ishwarya Lakshmi. R
Madhu mitha K P
M.RAJKUMAR
Yamuna.R
Mounika M 
CHANDRU. S
V.G.Latha
PRAVEENA A
Sivaranjini V
Karthikeyan Ravichandran 
Gowthaman.K
B. KAMALI 
BHUVANESHWARAN V
Ruba Raj
Kanimozhi L
Abisheik M
Mohamed Ramiz A
SIBY R
Nathiya Muthusamy 
Kavinilammurugu M A S
Ramakrishnan PRATHEEBARAN 
`;

// New Video Editing students - February 2026
const veStudentsRaw = `
Bindhu N
s.dhanalakshmi
Selva Ishwarya 
SIKENDAR BASHA M
Vasantha kumar
Mugilarasu G
JAYARAJ P
Vishnusithan A
Vidhyambigai S
Niyamath. A
Indumathi 
Sai Selva
`;

// Parse and clean names
const parseNames = (rawText) => {
  return rawText
    .split('\n')
    .map(name => name.trim())
    .filter(name => name.length > 0);
};

// Generate Certificate ID
// Format: BMA{MONTH}{COURSE}MES/Q{BATCH}S{NUMBER}
// For Feb 2026: BMAFEB...
const generateDMCertId = (number) => {
  // Using BMAFEBDMMES/Q0506S format for February 2026 batch
  return `BMAFEBDMMES/Q0506S${String(number).padStart(3, '0')}`;
};

const generateVECertId = (number) => {
  // Using BMAFEBVEMES/Q1402S format for February 2026 batch
  return `BMAFEBVEMES/Q1402S${String(number).padStart(3, '0')}`;
};

// Normalize name for comparison
const normalizeName = (name) => {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
    .replace(/,/g, '');
};

async function addStudents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const dmNames = parseNames(dmStudentsRaw);
    const veNames = parseNames(veStudentsRaw);

    console.log(`📋 DM Students to add: ${dmNames.length}`);
    console.log(`📋 VE Students to add: ${veNames.length}\n`);

    // ==========================================
    // ADD DIGITAL MARKETING STUDENTS
    // ==========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📚 ADDING DIGITAL MARKETING STUDENTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get existing DM students to check for duplicates and find next number
    const existingDM = await CourseStudent.find({ courseSlug: 'digital-marketing' });
    const existingDMNames = new Set(existingDM.map(s => normalizeName(s.name)));
    
    // Find highest certificate number used with BMAFEB prefix
    let maxDMNum = 0;
    existingDM.forEach(s => {
      if (s.certificateId && s.certificateId.includes('BMAFEBDMMES/Q0506S')) {
        const match = s.certificateId.match(/Q0506S(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxDMNum) maxDMNum = num;
        }
      }
    });
    
    let dmInserted = 0;
    let dmSkipped = 0;
    let nextDMNum = maxDMNum + 1;

    for (const name of dmNames) {
      const normalizedName = normalizeName(name);
      
      if (existingDMNames.has(normalizedName)) {
        console.log(`⏭️  Skipped (exists): ${name}`);
        dmSkipped++;
        continue;
      }

      const certId = generateDMCertId(nextDMNum);
      
      try {
        const student = new CourseStudent({
          name: name.trim(),
          courseName: 'Digital Marketing',
          courseSlug: 'digital-marketing',
          certificateId: certId,
          isEligible: true,
          certificateSent: false,
          dateOfRegistration: new Date()
        });

        await student.save();
        console.log(`✅ Added: ${name} (${certId})`);
        dmInserted++;
        existingDMNames.add(normalizedName);
        nextDMNum++;
      } catch (err) {
        console.error(`❌ Error adding ${name}: ${err.message}`);
      }
    }

    console.log(`\n📊 DM Summary: Added ${dmInserted}, Skipped ${dmSkipped}\n`);

    // ==========================================
    // ADD VIDEO EDITING STUDENTS
    // ==========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎬 ADDING VIDEO EDITING STUDENTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get existing VE students to check for duplicates and find next number
    const existingVE = await CourseStudent.find({ courseSlug: 'video-editing' });
    const existingVENames = new Set(existingVE.map(s => normalizeName(s.name)));
    
    // Find highest certificate number used with BMAFEB prefix
    let maxVENum = 0;
    existingVE.forEach(s => {
      if (s.certificateId && s.certificateId.includes('BMAFEBVEMES/Q1402S')) {
        const match = s.certificateId.match(/Q1402S(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxVENum) maxVENum = num;
        }
      }
    });
    
    let veInserted = 0;
    let veSkipped = 0;
    let nextVENum = maxVENum + 1;

    for (const name of veNames) {
      const normalizedName = normalizeName(name);
      
      if (existingVENames.has(normalizedName)) {
        console.log(`⏭️  Skipped (exists): ${name}`);
        veSkipped++;
        continue;
      }

      const certId = generateVECertId(nextVENum);
      
      try {
        const student = new CourseStudent({
          name: name.trim(),
          courseName: 'Advanced Video Editing (AI-Integrated)',
          courseSlug: 'video-editing',
          certificateId: certId,
          isEligible: true,
          certificateSent: false,
          dateOfRegistration: new Date()
        });

        await student.save();
        console.log(`✅ Added: ${name} (${certId})`);
        veInserted++;
        existingVENames.add(normalizedName);
        nextVENum++;
      } catch (err) {
        console.error(`❌ Error adding ${name}: ${err.message}`);
      }
    }

    console.log(`\n📊 VE Summary: Added ${veInserted}, Skipped ${veSkipped}\n`);

    // ==========================================
    // FINAL SUMMARY
    // ==========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 FINAL SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Digital Marketing: ${dmInserted} added, ${dmSkipped} skipped`);
    console.log(`✅ Video Editing: ${veInserted} added, ${veSkipped} skipped`);
    console.log(`📝 Total: ${dmInserted + veInserted} new students added`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Final counts
    const finalDMCount = await CourseStudent.countDocuments({ courseSlug: 'digital-marketing' });
    const finalVECount = await CourseStudent.countDocuments({ courseSlug: 'video-editing' });
    
    console.log(`📈 Total Digital Marketing students: ${finalDMCount}`);
    console.log(`📈 Total Video Editing students: ${finalVECount}\n`);

    // List newly added students with their certificate IDs for verification
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 QR VERIFICATION URLs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('After generating certificates, QR codes will link to:');
    console.log('https://brand-monk.vercel.app/verify/course/{certificateId}');
    console.log('\nExample URLs for new students:');
    
    const newStudents = await CourseStudent.find({
      $or: [
        { certificateId: { $regex: /^BMAFEBDMMES\/Q0506S/ } },
        { certificateId: { $regex: /^BMAFEBVEMES\/Q1402S/ } }
      ]
    }).sort({ createdAt: -1 }).limit(5);
    
    newStudents.forEach(s => {
      console.log(`- ${s.name}: https://brand-monk.vercel.app/verify/course/${encodeURIComponent(s.certificateId)}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

addStudents();

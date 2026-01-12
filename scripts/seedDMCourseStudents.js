const mongoose = require('mongoose');
const CourseStudent = require('../models/CourseStudent');
require('dotenv').config();

// Digital Marketing Course Students
const studentNames = [
  'A.AJITH RAJ', 'Kashi Vishwanath', 'Balaji R', 'Ariharan P', 'Kowsalya T',
  'Syed Abdullah S I', 'R.S.HARINE', 'Rohan S', 'S. Gowtham', 'Bharath S',
  'SINDHUJA BALAJI', 'Selvaraj', 'Gayathri V', 'Indhumathi G.V', 'S. RANJITHA',
  'GUNASEKAR M', 'Karthikeyan M', 'KARTHIKEYAN K', 'Kailash S', 'Keerthika T K',
  'Jayanthi K', 'MUKESH KUMAR K', 'K R VIVEKKA', 'ROHITH G', 'Balavarshini K',
  'T.GOWTHAMI', 'VINOTHA R', 'A.Mohammed thansir', 'AYYAPPAN S', 'G. Suganyadevi',
  'Arunkumar M', 'Priyadharsini.M', 'DHANALAKSHMI B', 'Abinaya.G', 'R.K.Rukmani devi',
  'MOHAMED MUSHARAF ALI', 'Suba P', 'PRIYANKA M', 'Barath Navin B', 'k.vijjayalakshmi',
  'GP Narendran kumar', 'Deebika G', 'Dhivya Ananth D', 'Archana R', 'D SARANYA KARTHICK',
  'Yaga Roobini S', 'Sudha C', 'SIMHIKA V', 'KANNAN S', 'Dhivakar k',
  'Mohammed Arham Shah', 'E M Parmeshwar', 'SUDHAKAR G', 'MANIKANDAN. A', 'Sathish Kumar.s',
  'Payal D Goklani', 'K.Rajeevkaran', 'Asha Prathaban', 'Manikandan .R', 'JONI JANARTHANAN C',
  'Sangeeth kumar A', 'R RAJESH KUMAR', 'JANARTHANAN B', 'K ARUL', 'S.Gopalakrishnan',
  'K Harshitha', 'SRIKANTH S', 'LAKSHMI PRABHA.N', 'KARTHIKRAJA V', 'Sankaranarayanan M',
  'Keerthika k', 'A. JHANSI MARY', 'Kamini B', 'ARUL K', 'Sivaramachandran veeramai',
  'S. YOGANA', 'Joni Janarthanan .C', 'Prakash. S', 'Mukesh Kumar K', 'M. Gopu',
  'Guru Prema Dharshini Om', 'ARULHARI S', 'Bharath Kumar .S', 'Vidhya Karthik',
  'S.Gayathri', 'RAKSHINI S', 'MANOJKUMAR T', 'Muhammad Faizal Khan', 'Ruba Raj',
  'Alagiri Priya D', 'S.SENTAMILSELVI', 'Sudharsan', 'Naveen Raj R', 'Kuppili Sruthi',
  'Krishna Kumar S', 'Sivaramachandran Veeramani', 'Monisha S', 'DYANESH R', 'MEGALA J',
  'K.kavya', 'SIVANI S', 'Madhumitha R', 'KARTHICK Periyasamy', 'Gopalakrishnan S',
  'Dhivakar', 'Sudha. C', 'Sijoy. J', 'Sindhuja Balaji', 'GOWTHAMI.T',
  'A.Mohammed Ali', 'SAMSON.S', 'SELVAM M', 'L.KRISHNAMOORTHY', 'Yuvaraj K',
  'BALACHANDAR D', 'Sivaramachandran', 'K YUVARAJ', 'M.Sneha', 'GP Narendran Kumar',
  'Rohith G', 'S.N. SYED AAQIB', 'S.purushothaman', 'Mohammed Abdul Sukkur A',
  'Shalini Subramani', 'Rajkumar M', 'IMMANUEL HORRIES K', 'B.Ahamed Mujjamil',
  'BALAJI R', 'P Jayashri', 'Blessie S', 'Harshni P', 'CHINNA DURAI',
  'Rameezbanu M', 'C. R. ASHOK', 'JAYA SREE', 'PRATHEEBARAN RAMAKRISHNAN',
  'Aravindhan', 'Darice Asina Devi', 'P.Suba', 'R.Sathiyavathi', 'Muralikanth G',
  'SATHISHKUMAR M', 'Gayathri Selvaraj', 'S.VINOTHINI', 'G.Suganyadevi', 'B. KAMALI',
  'ASWANI.MS'
];

// Remove duplicates
const uniqueNames = [...new Set(studentNames.map(n => n.trim()).filter(n => n.length > 0))];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected\n');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const generateCertificateId = (index) => {
  // BMADM = Brand Monk Academy Digital Marketing
  const paddedNum = String(index + 1).padStart(4, '0');
  return `BMADM${paddedNum}`;
};

const seedDigitalMarketingStudents = async () => {
  await connectDB();

  console.log(`Seeding ${uniqueNames.length} Digital Marketing Course Students...\n`);

  // Get existing certificate IDs to avoid duplicates
  const existing = await CourseStudent.find({ courseSlug: 'digital-marketing' });
  const existingNames = new Set(existing.map(s => s.name.toLowerCase().trim()));
  
  // Find the highest existing certificate number
  let maxNum = 0;
  existing.forEach(s => {
    if (s.certificateId && s.certificateId.startsWith('BMADM')) {
      const num = parseInt(s.certificateId.replace('BMADM', ''));
      if (num > maxNum) maxNum = num;
    }
  });

  let inserted = 0;
  let skipped = 0;
  let currentNum = maxNum;

  for (const name of uniqueNames) {
    const normalizedName = name.toLowerCase().trim();
    
    // Skip if already exists
    if (existingNames.has(normalizedName)) {
      console.log(`⏭️ Exists: ${name}`);
      skipped++;
      continue;
    }

    currentNum++;
    const certId = `BMADM${String(currentNum).padStart(4, '0')}`;

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
      inserted++;
      existingNames.add(normalizedName);
    } catch (err) {
      console.error(`❌ Error: ${name} - ${err.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SEEDING COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Inserted: ${inserted}`);
  console.log(`⏭️ Skipped (duplicates): ${skipped}`);

  const total = await CourseStudent.countDocuments({ courseSlug: 'digital-marketing' });
  console.log(`\n📊 Total Digital Marketing Course Students: ${total}`);

  process.exit(0);
};

seedDigitalMarketingStudents();

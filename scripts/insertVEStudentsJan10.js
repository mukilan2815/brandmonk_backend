const mongoose = require('mongoose');
const Student = require('../models/Student');
const Webinar = require('../models/Webinar');
require('dotenv').config();

// The students to add - parsed from the user's list
// Format: Name, Email, Phone, Program Name, Program Type, Location, Profession, College, Dept, Year, CertID, InstaFollowed, RegDate
const studentsToAdd = [
  // Video Editing - Jan 10 webinar (40 students)
  { name: 'Vidhyambigai S', email: 'vidhyambigais1768193316550@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765503', regDate: '12 Jan 2026' },
  { name: 'Vishnusithan A', email: 'vishnusithana1768193316238@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765502', regDate: '12 Jan 2026' },
  { name: 'SIKENDAR BASHA M', email: 'sikendarbasham1768193316097@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765501', regDate: '12 Jan 2026' },
  { name: 'Mugilarasu G', email: 'mugilarasug1768193315953@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765500', regDate: '12 Jan 2026' },
  { name: 'Bindhu N', email: 'bindhun1768193315755@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765499', regDate: '12 Jan 2026' },
  { name: 'THIKA P', email: 'thikap1768193315613@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765498', regDate: '12 Jan 2026' },
  { name: 'KARTHIK C', email: 'karthikc1768193315302@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765497', regDate: '12 Jan 2026' },
  { name: 'Surya Narayanan', email: 'suryanarayanan1768193315146@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765496', regDate: '12 Jan 2026' },
  { name: 'J.Lakshnanan', email: 'jlakshnanan1768193314748@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765495', regDate: '12 Jan 2026' },
  { name: 'Monisha Valli M V', email: 'monishavallimv1768193314597@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765494', regDate: '12 Jan 2026' },
  { name: 'Poovarasan Murugesan', email: 'poovarasanmurugesan1768193314436@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765493', regDate: '12 Jan 2026' },
  { name: 'Sakthikumar K.G', email: 'sakthikumarkg1768193314198@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765492', regDate: '12 Jan 2026' },
  { name: 'N. Mahalakshmi', email: 'nmahalakshmi1768193314050@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765491', regDate: '12 Jan 2026' },
  { name: 'Jabaraj J', email: 'jabarajj1768193313906@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765490', regDate: '12 Jan 2026' },
  { name: 'Sivasangari P', email: 'sivasangarip1768193313410@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765489', regDate: '12 Jan 2026' },
  { name: 'Jabaraj j', email: 'jabarajj1768193313238@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765488', regDate: '12 Jan 2026' },
  { name: 'Saraswathi M', email: 'saraswathim1768193313079@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765487', regDate: '12 Jan 2026' },
  { name: 'Jayashree Y', email: 'jayashreey1768193312939@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765486', regDate: '12 Jan 2026' },
  { name: 'N.Mahalakshmi', email: 'nmahalakshmi1768193312789@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765485', regDate: '12 Jan 2026' },
  { name: 'Srikanth.s', email: 'srikanths1768193312643@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765484', regDate: '12 Jan 2026' },
  { name: 'Lokesh S', email: 'lokeshs1768193312490@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765483', regDate: '12 Jan 2026' },
  { name: 'Prabakaran S', email: 'prabakarans1768193312308@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765482', regDate: '12 Jan 2026' },
  { name: 'Hemarangan G', email: 'hemarangang1768193311984@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765481', regDate: '12 Jan 2026' },
  { name: 'ARUN PRASATH S', email: 'arunprasaths1768193311821@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765480', regDate: '12 Jan 2026' },
  { name: 'G.Vaishnavi', email: 'gvaishnavi1768193311676@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765479', regDate: '12 Jan 2026' },
  { name: 'Sabareesan Ponnuvel', email: 'sabareesanponnuvel1768193311540@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765478', regDate: '12 Jan 2026' },
  { name: 'G.SUJIKUMARI', email: 'gsujikumari1768193311370@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765477', regDate: '12 Jan 2026' },
  { name: 'Sakthikumar', email: 'sakthikumar1768193311217@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765476', regDate: '12 Jan 2026' },
  { name: 'J.Lakshmanan', email: 'jlakshmanan1768193311061@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765475', regDate: '12 Jan 2026' },
  { name: 'M.A.KAVINILAVU', email: 'makavinilavu1768193310862@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765474', regDate: '12 Jan 2026' },
  { name: 'Revathi Subramaniyam', email: 'revathisubramaniyam1768193310709@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765473', regDate: '12 Jan 2026' },
  { name: 'vinoth vijayakumar', email: 'vinothvijayakumar1768193310553@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765472', regDate: '12 Jan 2026' },
  { name: 'JEEVA. M', email: 'jeevam1768193310398@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765471', regDate: '12 Jan 2026' },
  { name: 'Suveitha R', email: 'suveithar1768193310231@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765470', regDate: '12 Jan 2026' },
  { name: 'KISHORE G', email: 'kishoreg1768193310061@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765469', regDate: '12 Jan 2026' },
  { name: 'Mohammed Aasif Iqbal S A', email: 'mohammedaasifiqbalsa1768193309871@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765468', regDate: '12 Jan 2026' },
  { name: 'Saran S', email: 'sarans1768193309729@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765467', regDate: '12 Jan 2026' },
  { name: 'M.Akash', email: 'makash1768193309560@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765466', regDate: '12 Jan 2026' },
  { name: 'M. SABEERA BANU', email: 'msabeerabanu1768193309410@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765465', regDate: '12 Jan 2026' },
  { name: 'SURYA A', email: 'suryaa1768193309270@bma.temp', phone: '0000000000', programName: 'Video Editing', certificateId: 'SMAPARMQ0765464', regDate: '12 Jan 2026' },
];

// Target webinar for Jan 10/12 Video Editing
const targetWebinarSlug = 'video-editing-k2n0da7t';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected\n');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const parseDate = (dateStr) => {
  const months = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  const parts = dateStr.trim().split(' ');
  const day = parseInt(parts[0]);
  const month = months[parts[1]];
  const year = parseInt(parts[2]);
  return new Date(year, month, day);
};

const insertStudents = async () => {
  await connectDB();

  // Find the target webinar
  const webinar = await Webinar.findOne({ slug: targetWebinarSlug });
  
  if (!webinar) {
    console.log(`Webinar ${targetWebinarSlug} not found!`);
    process.exit(1);
  }

  console.log('Target Webinar:');
  console.log(`  Name: ${webinar.name}`);
  console.log(`  Slug: ${webinar.slug}`);
  console.log(`  Date: ${new Date(webinar.date).toLocaleDateString('en-IN')}`);
  console.log('');

  // Check existing students
  const existingEmails = new Set(
    (await Student.find({}, { email: 1 })).map(s => s.email?.toLowerCase().trim())
  );
  const existingCertIds = new Set(
    (await Student.find({}, { certificateId: 1 })).map(s => s.certificateId).filter(Boolean)
  );

  let inserted = 0;
  let skipped = 0;

  console.log(`Inserting ${studentsToAdd.length} students...\n`);

  for (const s of studentsToAdd) {
    const email = s.email.toLowerCase().trim();
    
    // Skip if exists
    if (existingEmails.has(email)) {
      console.log(`⏭️ Email exists: ${s.name}`);
      skipped++;
      continue;
    }
    if (existingCertIds.has(s.certificateId)) {
      console.log(`⏭️ CertID exists: ${s.name}`);
      skipped++;
      continue;
    }

    try {
      const newStudent = new Student({
        name: s.name,
        email: s.email,
        phone: s.phone || 'N/A',
        webinarId: webinar._id,
        webinarName: webinar.name,
        webinarSlug: webinar.slug,
        location: 'Online',
        profession: 'Student',
        certificateId: s.certificateId,
        isEligible: true,
        hasFollowedInstagram: true,
        certificateSent: false,
        dateOfRegistration: parseDate(s.regDate)
      });

      await newStudent.save();
      console.log(`✅ Added: ${s.name}`);
      inserted++;
      existingEmails.add(email);
      existingCertIds.add(s.certificateId);
    } catch (err) {
      console.error(`❌ Error adding ${s.name}: ${err.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('INSERT COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Inserted: ${inserted}`);
  console.log(`⏭️ Skipped: ${skipped}`);

  const count = await Student.countDocuments({ webinarSlug: targetWebinarSlug });
  console.log(`\n📊 Students in ${targetWebinarSlug}: ${count}`);

  process.exit(0);
};

insertStudents();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Webinar = require('../models/Webinar');
require('dotenv').config();

// These 40 students need to be assigned to Video Editing webinar on 1/10/2026
const studentCertIds = [
  'SMAPARMQ0765503', 'SMAPARMQ0765502', 'SMAPARMQ0765501', 'SMAPARMQ0765500',
  'SMAPARMQ0765499', 'SMAPARMQ0765498', 'SMAPARMQ0765497', 'SMAPARMQ0765496',
  'SMAPARMQ0765495', 'SMAPARMQ0765494', 'SMAPARMQ0765493', 'SMAPARMQ0765492',
  'SMAPARMQ0765491', 'SMAPARMQ0765490', 'SMAPARMQ0765489', 'SMAPARMQ0765488',
  'SMAPARMQ0765487', 'SMAPARMQ0765486', 'SMAPARMQ0765485', 'SMAPARMQ0765484',
  'SMAPARMQ0765483', 'SMAPARMQ0765482', 'SMAPARMQ0765481', 'SMAPARMQ0765480',
  'SMAPARMQ0765479', 'SMAPARMQ0765478', 'SMAPARMQ0765477', 'SMAPARMQ0765476',
  'SMAPARMQ0765475', 'SMAPARMQ0765474', 'SMAPARMQ0765473', 'SMAPARMQ0765472',
  'SMAPARMQ0765471', 'SMAPARMQ0765470', 'SMAPARMQ0765469', 'SMAPARMQ0765468',
  'SMAPARMQ0765467', 'SMAPARMQ0765466', 'SMAPARMQ0765465', 'SMAPARMQ0765464'
];

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

const assignStudentsToWebinar = async () => {
  await connectDB();

  // Find the target webinar
  const webinar = await Webinar.findOne({ slug: targetWebinarSlug });
  
  if (!webinar) {
    console.log(`Webinar with slug ${targetWebinarSlug} not found!`);
    process.exit(1);
  }

  console.log('Target Webinar:');
  console.log(`  Name: ${webinar.name}`);
  console.log(`  Slug: ${webinar.slug}`);
  console.log(`  Date: ${new Date(webinar.date).toLocaleDateString('en-IN')}`);
  console.log(`  ID: ${webinar._id}`);
  console.log('');

  console.log(`Updating ${studentCertIds.length} students...\n`);

  let updated = 0;
  let notFound = 0;

  for (const certId of studentCertIds) {
    const result = await Student.findOneAndUpdate(
      { certificateId: certId },
      {
        $set: {
          webinarId: webinar._id,
          webinarSlug: webinar.slug,
          webinarName: webinar.name
        }
      },
      { new: true }
    );

    if (result) {
      updated++;
      console.log(`✅ Updated: ${result.name} (${certId})`);
    } else {
      notFound++;
      console.log(`❌ Not found: ${certId}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ASSIGNMENT COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Not found: ${notFound}`);

  // Verify the count
  const newCount = await Student.countDocuments({ webinarSlug: targetWebinarSlug });
  console.log(`\n📊 Total students now in ${targetWebinarSlug}: ${newCount}`);

  process.exit(0);
};

assignStudentsToWebinar();

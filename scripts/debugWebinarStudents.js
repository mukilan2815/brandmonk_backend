const mongoose = require('mongoose');
const Student = require('../models/Student');
const Webinar = require('../models/Webinar');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected\n');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const checkWebinarStudents = async () => {
  await connectDB();

  // Get specific webinar
  const targetSlug = 'video-editing-k2n0da7t';
  const webinar = await Webinar.findOne({ slug: targetSlug });
  
  if (!webinar) {
    console.log(`Webinar with slug ${targetSlug} not found`);
  } else {
    console.log('Webinar Details:');
    console.log(`  Name: ${webinar.name}`);
    console.log(`  Slug: ${webinar.slug}`);
    console.log(`  Date: ${new Date(webinar.date).toLocaleDateString('en-IN')}`);
    console.log(`  Created: ${new Date(webinar.createdAt).toLocaleDateString('en-IN')}`);
    console.log(`  ID: ${webinar._id}`);
    console.log('');

    // Find students linked to this webinar
    const byId = await Student.countDocuments({ webinarId: webinar._id });
    const bySlug = await Student.countDocuments({ webinarSlug: targetSlug });
    const byName = await Student.countDocuments({ webinarName: webinar.name });

    console.log(`Students linked by webinarId: ${byId}`);
    console.log(`Students linked by webinarSlug: ${bySlug}`);
    console.log(`Students with webinarName "${webinar.name}": ${byName}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ALL VIDEO EDITING WEBINARS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const veWebinars = await Webinar.find({ name: /video editing/i }).sort({ date: -1 });
  
  for (const w of veWebinars) {
    const count = await Student.countDocuments({ 
      $or: [
        { webinarId: w._id },
        { webinarSlug: w.slug }
      ]
    });
    const date = new Date(w.date).toLocaleDateString('en-IN');
    console.log(`${w.name} (${date}) [${w.slug}]: ${count} students`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('VIDEO EDITING STUDENTS BREAKDOWN:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const veStudents = await Student.find({ webinarName: /video editing/i });
  const bySlug = {};
  
  veStudents.forEach(s => {
    const key = s.webinarSlug || 'NO_SLUG';
    bySlug[key] = (bySlug[key] || 0) + 1;
  });

  Object.entries(bySlug).sort((a, b) => b[1] - a[1]).forEach(([slug, count]) => {
    console.log(`  ${slug}: ${count} students`);
  });

  process.exit(0);
};

checkWebinarStudents();

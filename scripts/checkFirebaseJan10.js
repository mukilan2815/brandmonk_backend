const fs = require('fs');

// Find the latest firebase backup file
const files = fs.readdirSync('.').filter(f => f.startsWith('firebase_backup_') && f.endsWith('.json'));
if (files.length === 0) {
  console.log('No firebase backup file found.');
  process.exit(1);
}

const latestBackup = files.sort().reverse()[0];
console.log(`Using backup file: ${latestBackup}\n`);

const firebaseData = JSON.parse(fs.readFileSync(latestBackup, 'utf-8'));

console.log(`Total students in Firebase backup: ${firebaseData.students.length}\n`);

// Check for Video Editing students registered around Jan 10, 2026
const jan10 = new Date('2026-01-10');
const jan11 = new Date('2026-01-11');
const jan12 = new Date('2026-01-12');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('VIDEO EDITING STUDENTS IN FIREBASE BY REGISTRATION DATE:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const veStudents = firebaseData.students.filter(s => {
  const name = (s.webinarName || '').toLowerCase();
  return name.includes('video editing') || name.includes('video-editing');
});

console.log(`Total Video Editing students in Firebase: ${veStudents.length}\n`);

// Group by date
const byDate = {};
veStudents.forEach(s => {
  const regDate = new Date(s.dateOfRegistration || s.createdAt || s.backupTimestamp);
  const dateKey = regDate.toISOString().split('T')[0];
  if (!byDate[dateKey]) byDate[dateKey] = [];
  byDate[dateKey].push(s);
});

// Sort by date descending and show
Object.keys(byDate)
  .sort((a, b) => new Date(b) - new Date(a))
  .slice(0, 15) // Show last 15 dates
  .forEach(date => {
    console.log(`${date}: ${byDate[date].length} students`);
  });

// Check if any students registered on Jan 10
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('STUDENTS REGISTERED ON JAN 10-12, 2026 (Video Editing):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const jan10to12Students = veStudents.filter(s => {
  const regDate = new Date(s.dateOfRegistration || s.createdAt || s.backupTimestamp);
  return regDate >= jan10 && regDate < new Date('2026-01-13');
});

console.log(`Found ${jan10to12Students.length} Video Editing students from Jan 10-12, 2026`);

if (jan10to12Students.length > 0) {
  console.log('\nFirst 10:');
  jan10to12Students.slice(0, 10).forEach((s, i) => {
    const regDate = new Date(s.dateOfRegistration || s.createdAt).toLocaleDateString('en-IN');
    console.log(`${i + 1}. ${s.name} (${s.email}) - Registered: ${regDate}`);
    console.log(`   webinarSlug: ${s.webinarSlug || 'N/A'}`);
  });
}

// Check ALL students from Jan 10-12 across all webinars
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('ALL STUDENTS FROM JAN 10-12, 2026 (ALL WEBINARS):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const allJan10to12 = firebaseData.students.filter(s => {
  const regDate = new Date(s.dateOfRegistration || s.createdAt || s.backupTimestamp);
  return regDate >= jan10 && regDate < new Date('2026-01-13');
});

console.log(`Total students from Jan 10-12, 2026: ${allJan10to12.length}`);

// Group by webinar
const byWebinar = {};
allJan10to12.forEach(s => {
  const key = s.webinarName || 'Unknown';
  byWebinar[key] = (byWebinar[key] || 0) + 1;
});

Object.entries(byWebinar).forEach(([name, count]) => {
  console.log(`  ${name}: ${count}`);
});

console.log('\n✅ Firebase backup analysis complete.');

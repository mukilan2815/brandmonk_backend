const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = {
  apiKey: "AIzaSyC4hVhbCkF4vXsfbxpv3vuV-ZWupw1MXCE",
  authDomain: "brandmonk-certificate.firebaseapp.com",
  projectId: "brandmonk-certificate",
  storageBucket: "brandmonk-certificate.firebasestorage.app",
  messagingSenderId: "983901468498",
  appId: "1:983901468498:web:8906b437bfc86ca913ec8b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function downloadAllData() {
  console.log('Downloading all data from Firebase...\n');

  const data = {
    students: [],
    webinars: [],
    backup_logs: [],
    downloadedAt: new Date().toISOString()
  };

  // Download Students
  try {
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    studentsSnapshot.forEach(doc => {
      data.students.push({ id: doc.id, ...doc.data() });
    });
    console.log(`✅ Students: ${data.students.length} records`);
  } catch (err) {
    console.error('❌ Error fetching students:', err.message);
  }

  // Download Webinars
  try {
    const webinarsSnapshot = await getDocs(collection(db, 'webinars'));
    webinarsSnapshot.forEach(doc => {
      data.webinars.push({ id: doc.id, ...doc.data() });
    });
    console.log(`✅ Webinars: ${data.webinars.length} records`);
  } catch (err) {
    console.error('❌ Error fetching webinars:', err.message);
  }

  // Download Backup Logs
  try {
    const logsSnapshot = await getDocs(collection(db, 'backup_logs'));
    logsSnapshot.forEach(doc => {
      data.backup_logs.push({ id: doc.id, ...doc.data() });
    });
    console.log(`✅ Backup Logs: ${data.backup_logs.length} records`);
  } catch (err) {
    console.error('❌ Error fetching backup_logs:', err.message);
  }

  // Save to file
  const filename = `firebase_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  
  console.log(`\n📁 Data saved to: ${filename}`);
  console.log(`   Total: ${data.students.length} students, ${data.webinars.length} webinars, ${data.backup_logs.length} logs`);
  
  process.exit(0);
}

downloadAllData();

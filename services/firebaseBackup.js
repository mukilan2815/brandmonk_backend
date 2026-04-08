// Firebase Backup Service
// This service automatically syncs all data to Firebase Firestore for backup
// Completely optional - if Firebase fails to load, all functions become no-ops

let firebaseInitialized = false;
let db = null;
let collectionFn = null;
let docFn = null;
let setDocFn = null;
let deleteDocFn = null;
let getDocsFn = null;
let writeBatchFn = null;

// Try to initialize Firebase - if it fails, we'll just skip backups
try {
  const { initializeApp } = require('firebase/app');
  const firestore = require('firebase/firestore');
  
  const firebaseConfig = {
    apiKey: "AIzaSyC4hVhbCkF4vXsfbxpv3vuV-ZWupw1MXCE",
    authDomain: "brandmonk-certificate.firebaseapp.com",
    projectId: "brandmonk-certificate",
    storageBucket: "brandmonk-certificate.firebasestorage.app",
    messagingSenderId: "983901468498",
    appId: "1:983901468498:web:8906b437bfc86ca913ec8b"
  };

  const app = initializeApp(firebaseConfig);
  db = firestore.getFirestore(app);
  collectionFn = firestore.collection;
  docFn = firestore.doc;
  setDocFn = firestore.setDoc;
  deleteDocFn = firestore.deleteDoc;
  getDocsFn = firestore.getDocs;
  writeBatchFn = firestore.writeBatch;
  
  firebaseInitialized = true;
  console.log("🔥 Firebase initialized for backup");
} catch (error) {
  console.warn("⚠️ Firebase not available:", error.message);
  console.log("📝 App will continue without Firebase backup");
}

// Collection names
const COLLECTIONS = {
  STUDENTS: 'students',
  WEBINARS: 'webinars',
  BACKUP_LOG: 'backup_logs'
};

// Check if Firebase is ready
const isFirebaseAvailable = () => firebaseInitialized && db !== null;

// Sanitize MongoDB document for Firestore
const sanitizeForFirestore = (docData) => {
  if (!docData) return null;
  const sanitized = {};
  const data = docData._doc || docData;
  
  for (const [key, value] of Object.entries(data)) {
    if (key === '__v') continue;
    if (value === null || value === undefined) {
      sanitized[key] = null;
    } else if (value instanceof Date) {
      sanitized[key] = value.toISOString();
    } else if (typeof value === 'object' && value._bsontype === 'ObjectId') {
      sanitized[key] = value.toString();
    } else if (typeof value === 'object' && value.toString && value._id) {
      sanitized[key] = value.toString();
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeForFirestore(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  if (sanitized._id && typeof sanitized._id !== 'string') {
    sanitized._id = sanitized._id.toString();
  }
  
  return sanitized;
};

// Backup a single student - NO-OP if Firebase not available
const backupStudent = async (student) => {
  if (!isFirebaseAvailable()) return false;
  
  try {
    const studentId = student._id.toString();
    const sanitizedData = sanitizeForFirestore(student);
    sanitizedData.backupTimestamp = new Date().toISOString();
    
    await setDocFn(docFn(db, COLLECTIONS.STUDENTS, studentId), sanitizedData);
    console.log(`✅ Firebase: Student ${student.name} backed up`);
    return true;
  } catch (error) {
    console.error(`❌ Firebase backup error:`, error.message);
    return false;
  }
};

// Backup a single webinar - NO-OP if Firebase not available
const backupWebinar = async (webinar) => {
  if (!isFirebaseAvailable()) return false;
  
  try {
    const webinarId = webinar._id.toString();
    const sanitizedData = sanitizeForFirestore(webinar);
    sanitizedData.backupTimestamp = new Date().toISOString();
    
    await setDocFn(docFn(db, COLLECTIONS.WEBINARS, webinarId), sanitizedData);
    console.log(`✅ Firebase: Webinar ${webinar.name} backed up`);
    return true;
  } catch (error) {
    console.error(`❌ Firebase backup error:`, error.message);
    return false;
  }
};

// Log a backup event - NO-OP if Firebase not available
const logBackupEvent = async (action, details) => {
  if (!isFirebaseAvailable()) return false;
  
  try {
    const logId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await setDocFn(docFn(db, COLLECTIONS.BACKUP_LOG, logId), {
      action,
      details,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error(`❌ Firebase log error:`, error.message);
    return false;
  }
};

// Batch backup students - NO-OP if Firebase not available
const backupStudentsBatch = async (students) => {
  if (!isFirebaseAvailable()) return false;
  
  try {
    let batch = writeBatchFn(db);
    let count = 0;
    
    for (const student of students) {
      const studentId = student._id.toString();
      const sanitizedData = sanitizeForFirestore(student);
      sanitizedData.backupTimestamp = new Date().toISOString();
      
      const docRef = docFn(db, COLLECTIONS.STUDENTS, studentId);
      batch.set(docRef, sanitizedData);
      count++;
      
      if (count >= 450) {
        await batch.commit();
        console.log(`✅ Firebase: Batch committed ${count} students`);
        batch = writeBatchFn(db);
        count = 0;
      }
    }
    
    if (count > 0) {
      await batch.commit();
      console.log(`✅ Firebase: Batch committed ${count} students`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Firebase batch error:`, error.message);
    return false;
  }
};

// Batch backup webinars - NO-OP if Firebase not available
const backupWebinarsBatch = async (webinars) => {
  if (!isFirebaseAvailable()) return false;
  
  try {
    const batch = writeBatchFn(db);
    let count = 0;
    
    for (const webinar of webinars) {
      const webinarId = webinar._id.toString();
      const sanitizedData = sanitizeForFirestore(webinar);
      sanitizedData.backupTimestamp = new Date().toISOString();
      
      const docRef = docFn(db, COLLECTIONS.WEBINARS, webinarId);
      batch.set(docRef, sanitizedData);
      count++;
    }
    
    if (count > 0) {
      await batch.commit();
      console.log(`✅ Firebase: Batch committed ${count} webinars`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Firebase batch error:`, error.message);
    return false;
  }
};

// Full sync - NO-OP if Firebase not available
const fullSync = async (Student, Webinar) => {
  if (!isFirebaseAvailable()) {
    console.log('⏭️ Firebase not available, skipping sync');
    return false;
  }
  
  console.log('🔄 Starting Firebase sync...');
  
  try {
    const BATCH_SIZE = 300;

    // Stream students in chunks instead of loading the whole collection into memory.
    let studentBatch = [];
    let studentCount = 0;
    const studentCursor = Student.find({}).lean().cursor();

    for await (const student of studentCursor) {
      studentBatch.push(student);

      if (studentBatch.length >= BATCH_SIZE) {
        await backupStudentsBatch(studentBatch);
        studentCount += studentBatch.length;
        console.log(`📦 Synced ${studentCount} students so far`);
        studentBatch = [];
      }
    }

    if (studentBatch.length > 0) {
      await backupStudentsBatch(studentBatch);
      studentCount += studentBatch.length;
    }

    if (studentCount > 0) {
      console.log(`📦 Synced ${studentCount} students`);
    }

    // Webinars are usually smaller, but still process in chunks for safety.
    let webinarBatch = [];
    let webinarCount = 0;
    const webinarCursor = Webinar.find({}).lean().cursor();

    for await (const webinar of webinarCursor) {
      webinarBatch.push(webinar);

      if (webinarBatch.length >= BATCH_SIZE) {
        await backupWebinarsBatch(webinarBatch);
        webinarCount += webinarBatch.length;
        console.log(`📦 Synced ${webinarCount} webinars so far`);
        webinarBatch = [];
      }
    }

    if (webinarBatch.length > 0) {
      await backupWebinarsBatch(webinarBatch);
      webinarCount += webinarBatch.length;
    }

    if (webinarCount > 0) {
      console.log(`📦 Synced ${webinarCount} webinars`);
    }
    
    console.log('✅ Firebase sync complete!');
    return true;
  } catch (error) {
    console.error('❌ Sync error:', error.message);
    return false;
  }
};

// Get students from backup - returns empty array if Firebase not available
const getStudentsFromBackup = async () => {
  if (!isFirebaseAvailable()) return [];
  
  try {
    const querySnapshot = await getDocsFn(collectionFn(db, COLLECTIONS.STUDENTS));
    const students = [];
    querySnapshot.forEach((docSnap) => {
      students.push({ id: docSnap.id, ...docSnap.data() });
    });
    return students;
  } catch (error) {
    console.error('❌ Error fetching backup:', error.message);
    return [];
  }
};

// Get webinars from backup - returns empty array if Firebase not available
const getWebinarsFromBackup = async () => {
  if (!isFirebaseAvailable()) return [];
  
  try {
    const querySnapshot = await getDocsFn(collectionFn(db, COLLECTIONS.WEBINARS));
    const webinars = [];
    querySnapshot.forEach((docSnap) => {
      webinars.push({ id: docSnap.id, ...docSnap.data() });
    });
    return webinars;
  } catch (error) {
    console.error('❌ Error fetching backup:', error.message);
    return [];
  }
};

// Delete backup functions (for completeness)
const deleteStudentBackup = async () => false;
const deleteWebinarBackup = async () => false;

module.exports = {
  backupStudent,
  backupWebinar,
  deleteStudentBackup,
  deleteWebinarBackup,
  backupStudentsBatch,
  backupWebinarsBatch,
  logBackupEvent,
  fullSync,
  getStudentsFromBackup,
  getWebinarsFromBackup,
  isFirebaseAvailable,
  COLLECTIONS
};

// Firebase Backup Service
// This service automatically syncs all data to Firebase Firestore for backup
// Gracefully handles Firebase not being available

const firebase = require('../config/firebase');
const { db, collection, doc, setDoc, deleteDoc, getDocs, writeBatch, firebaseInitialized } = firebase;

// Collection names in Firestore
const COLLECTIONS = {
  STUDENTS: 'students',
  WEBINARS: 'webinars',
  ADMINS: 'admins',
  BACKUP_LOG: 'backup_logs'
};

/**
 * Check if Firebase is available
 */
const isFirebaseAvailable = () => {
  return firebaseInitialized && db !== null;
};

/**
 * Convert MongoDB document to a plain object suitable for Firestore
 * Handles ObjectId, Date, and other MongoDB-specific types
 */
const sanitizeForFirestore = (docData) => {
  if (!docData) return null;
  
  const sanitized = {};
  const data = docData._doc || docData;
  
  for (const [key, value] of Object.entries(data)) {
    if (key === '__v') continue; // Skip version key
    
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
  
  // Ensure _id is a string
  if (sanitized._id && typeof sanitized._id !== 'string') {
    sanitized._id = sanitized._id.toString();
  }
  
  return sanitized;
};

/**
 * Backup a single student to Firebase
 */
const backupStudent = async (student) => {
  if (!isFirebaseAvailable()) {
    console.log('⏭️ Firebase not available, skipping student backup');
    return false;
  }
  
  try {
    const studentId = student._id.toString();
    const sanitizedData = sanitizeForFirestore(student);
    sanitizedData.backupTimestamp = new Date().toISOString();
    
    await setDoc(doc(db, COLLECTIONS.STUDENTS, studentId), sanitizedData);
    console.log(`✅ Firebase Backup: Student ${student.name} (${studentId})`);
    return true;
  } catch (error) {
    console.error(`❌ Firebase Backup Error (Student):`, error.message);
    return false;
  }
};

/**
 * Backup a single webinar/course to Firebase
 */
const backupWebinar = async (webinar) => {
  if (!isFirebaseAvailable()) {
    console.log('⏭️ Firebase not available, skipping webinar backup');
    return false;
  }
  
  try {
    const webinarId = webinar._id.toString();
    const sanitizedData = sanitizeForFirestore(webinar);
    sanitizedData.backupTimestamp = new Date().toISOString();
    
    await setDoc(doc(db, COLLECTIONS.WEBINARS, webinarId), sanitizedData);
    console.log(`✅ Firebase Backup: Webinar/Course ${webinar.name} (${webinarId})`);
    return true;
  } catch (error) {
    console.error(`❌ Firebase Backup Error (Webinar):`, error.message);
    return false;
  }
};

/**
 * Delete a student backup from Firebase
 */
const deleteStudentBackup = async (studentId) => {
  if (!isFirebaseAvailable()) {
    return false;
  }
  
  try {
    await deleteDoc(doc(db, COLLECTIONS.STUDENTS, studentId.toString()));
    console.log(`🗑️ Firebase: Deleted student backup ${studentId}`);
    return true;
  } catch (error) {
    console.error(`❌ Firebase Delete Error (Student):`, error.message);
    return false;
  }
};

/**
 * Delete a webinar backup from Firebase
 */
const deleteWebinarBackup = async (webinarId) => {
  if (!isFirebaseAvailable()) {
    return false;
  }
  
  try {
    await deleteDoc(doc(db, COLLECTIONS.WEBINARS, webinarId.toString()));
    console.log(`🗑️ Firebase: Deleted webinar backup ${webinarId}`);
    return true;
  } catch (error) {
    console.error(`❌ Firebase Delete Error (Webinar):`, error.message);
    return false;
  }
};

/**
 * Backup multiple students in batch
 */
const backupStudentsBatch = async (students) => {
  if (!isFirebaseAvailable()) {
    console.log('⏭️ Firebase not available, skipping batch student backup');
    return false;
  }
  
  try {
    let batch = writeBatch(db);
    let count = 0;
    let totalCommitted = 0;
    
    for (const student of students) {
      const studentId = student._id.toString();
      const sanitizedData = sanitizeForFirestore(student);
      sanitizedData.backupTimestamp = new Date().toISOString();
      
      const docRef = doc(db, COLLECTIONS.STUDENTS, studentId);
      batch.set(docRef, sanitizedData);
      count++;
      
      // Firestore batch has a limit of 500 operations
      if (count >= 450) {
        await batch.commit();
        console.log(`✅ Firebase Batch: Committed ${count} students`);
        totalCommitted += count;
        batch = writeBatch(db); // Create new batch
        count = 0;
      }
    }
    
    if (count > 0) {
      await batch.commit();
      totalCommitted += count;
      console.log(`✅ Firebase Batch: Committed ${count} students`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Firebase Batch Error:`, error.message);
    return false;
  }
};

/**
 * Backup multiple webinars in batch
 */
const backupWebinarsBatch = async (webinars) => {
  if (!isFirebaseAvailable()) {
    console.log('⏭️ Firebase not available, skipping batch webinar backup');
    return false;
  }
  
  try {
    const batch = writeBatch(db);
    let count = 0;
    
    for (const webinar of webinars) {
      const webinarId = webinar._id.toString();
      const sanitizedData = sanitizeForFirestore(webinar);
      sanitizedData.backupTimestamp = new Date().toISOString();
      
      const docRef = doc(db, COLLECTIONS.WEBINARS, webinarId);
      batch.set(docRef, sanitizedData);
      count++;
    }
    
    if (count > 0) {
      await batch.commit();
      console.log(`✅ Firebase Batch: Committed ${count} webinars`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Firebase Batch Error (Webinars):`, error.message);
    return false;
  }
};

/**
 * Log a backup event
 */
const logBackupEvent = async (action, details) => {
  if (!isFirebaseAvailable()) {
    return false;
  }
  
  try {
    const logId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await setDoc(doc(db, COLLECTIONS.BACKUP_LOG, logId), {
      action,
      details,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error(`❌ Firebase Log Error:`, error.message);
    return false;
  }
};

/**
 * Full sync - backup all data from MongoDB to Firebase
 * Call this periodically or on server start
 */
const fullSync = async (Student, Webinar) => {
  if (!isFirebaseAvailable()) {
    console.log('⏭️ Firebase not available, skipping full sync');
    return false;
  }
  
  console.log('🔄 Starting full Firebase sync...');
  
  try {
    // Backup all students
    const students = await Student.find({});
    if (students.length > 0) {
      await backupStudentsBatch(students);
      console.log(`📦 Synced ${students.length} students to Firebase`);
    }
    
    // Backup all webinars
    const webinars = await Webinar.find({});
    if (webinars.length > 0) {
      await backupWebinarsBatch(webinars);
      console.log(`📦 Synced ${webinars.length} webinars to Firebase`);
    }
    
    await logBackupEvent('FULL_SYNC', {
      studentsCount: students.length,
      webinarsCount: webinars.length
    });
    
    console.log('✅ Full Firebase sync complete!');
    return true;
  } catch (error) {
    console.error('❌ Full sync error:', error.message);
    return false;
  }
};

/**
 * Get all students from Firebase backup
 */
const getStudentsFromBackup = async () => {
  if (!isFirebaseAvailable()) {
    console.log('⏭️ Firebase not available');
    return [];
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    const students = [];
    querySnapshot.forEach((docSnap) => {
      students.push({ id: docSnap.id, ...docSnap.data() });
    });
    return students;
  } catch (error) {
    console.error('❌ Error fetching students from backup:', error.message);
    return [];
  }
};

/**
 * Get all webinars from Firebase backup
 */
const getWebinarsFromBackup = async () => {
  if (!isFirebaseAvailable()) {
    console.log('⏭️ Firebase not available');
    return [];
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.WEBINARS));
    const webinars = [];
    querySnapshot.forEach((docSnap) => {
      webinars.push({ id: docSnap.id, ...docSnap.data() });
    });
    return webinars;
  } catch (error) {
    console.error('❌ Error fetching webinars from backup:', error.message);
    return [];
  }
};

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

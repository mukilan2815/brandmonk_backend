// Firebase Configuration for Backup
// Uses try-catch to handle initialization errors gracefully

let db = null;
let firebaseInitialized = false;
let firebaseError = null;

// Firebase Firestore functions (will be null if Firebase fails to initialize)
let collectionFn = null;
let docFn = null;
let setDocFn = null;
let deleteDocFn = null;
let getDocsFn = null;
let writeBatchFn = null;

try {
  const { initializeApp } = require('firebase/app');
  const firestore = require('firebase/firestore');
  
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyC4hVhbCkF4vXsfbxpv3vuV-ZWupw1MXCE",
    authDomain: "brandmonk-certificate.firebaseapp.com",
    projectId: "brandmonk-certificate",
    storageBucket: "brandmonk-certificate.firebasestorage.app",
    messagingSenderId: "983901468498",
    appId: "1:983901468498:web:8906b437bfc86ca913ec8b"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  db = firestore.getFirestore(app);
  
  // Assign Firestore functions
  collectionFn = firestore.collection;
  docFn = firestore.doc;
  setDocFn = firestore.setDoc;
  deleteDocFn = firestore.deleteDoc;
  getDocsFn = firestore.getDocs;
  writeBatchFn = firestore.writeBatch;
  
  firebaseInitialized = true;
  console.log("🔥 Firebase initialized for backup");
} catch (error) {
  firebaseError = error;
  console.error("⚠️ Firebase initialization failed:", error.message);
  console.log("📝 Backup will continue to work locally, Firebase backup disabled");
}

module.exports = { 
  db, 
  collection: collectionFn, 
  doc: docFn, 
  setDoc: setDocFn, 
  deleteDoc: deleteDocFn, 
  getDocs: getDocsFn, 
  writeBatch: writeBatchFn,
  firebaseInitialized,
  firebaseError
};

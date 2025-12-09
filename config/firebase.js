// Firebase Configuration for Backup
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, deleteDoc, getDocs, writeBatch } = require('firebase/firestore');

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
const db = getFirestore(app);

console.log("🔥 Firebase initialized for backup");

module.exports = { app, db, collection, doc, setDoc, deleteDoc, getDocs, writeBatch };

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const webinarRoutes = require('./routes/webinarRoutes');
const courseStudentRoutes = require('./routes/courseStudentRoutes');



// Firebase Backup Service
const { fullSync, getStudentsFromBackup, getWebinarsFromBackup } = require('./services/firebaseBackup');
const Student = require('./models/Student');
const Webinar = require('./models/Webinar');

// Load environment variables
dotenv.config();

const app = express();

console.log('========================================');
console.log('🚀 Starting Brand Monk Academy Server...');
console.log('========================================');
console.log('Port:', process.env.PORT || 5000);
console.log('MongoDB URI exists:', !!process.env.MONGO_URI);
console.log('Email configured:', !!process.env.EMAIL_USER);

// CORS Configuration
const corsOptions = {
  origin: [
    'https://brand-monk.vercel.app',
    'https://brand-monk-ga7q20shy-mukilans-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
connectDB();

// API Routes
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webinars', webinarRoutes);
app.use('/api/course-students', courseStudentRoutes);



// Health check endpoint
  app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Brand Monk Academy API is running'
  });
});

// Firebase Full Sync Endpoint - Manually trigger backup of all data
app.post('/api/admin/firebase-sync', async (req, res) => {
  try {
    console.log('📦 Manual Firebase sync triggered...');
    await fullSync(Student, Webinar);
    res.json({
      success: true,
      message: 'Full Firebase sync completed successfully!'
    });
  } catch (error) {
    console.error('Firebase sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Firebase sync failed: ' + error.message
    });
  }
});

// Get backup data from Firebase (for recovery if MongoDB is lost)
app.get('/api/admin/firebase-backup/students', async (req, res) => {
  try {
    const students = await getStudentsFromBackup();
    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Get backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup data: ' + error.message
    });
  }
});

app.get('/api/admin/firebase-backup/webinars', async (req, res) => {
  try {
    const webinars = await getWebinarsFromBackup();
    res.json({
      success: true,
      count: webinars.length,
      webinars
    });
  } catch (error) {
    console.error('Get backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup data: ' + error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Brand Monk Academy API',
    endpoints: {
      students: '/api/students',
      admin: '/api/admin',
      webinars: '/api/webinars',
      health: '/api/health',
      firebaseSync: '/api/admin/firebase-sync (POST)',
      firebaseBackupStudents: '/api/admin/firebase-backup/students (GET)',
      firebaseBackupWebinars: '/api/admin/firebase-backup/webinars (GET)'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log('========================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}`);
  console.log('========================================');
  
  // Perform initial Firebase sync after server starts
  console.log('🔄 Starting initial Firebase backup sync...');
  setTimeout(async () => {
    try {
      await fullSync(Student, Webinar);
      console.log('✅ Initial Firebase sync completed!');
    } catch (error) {
      console.error('⚠️ Initial Firebase sync failed:', error.message);
    }
  }, 5000); // Wait 5 seconds for MongoDB connection to be established
});

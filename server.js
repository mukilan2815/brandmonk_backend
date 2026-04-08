const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const webinarRoutes = require('./routes/webinarRoutes');
const courseStudentRoutes = require('./routes/courseStudentRoutes');

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
    'http://localhost:3001',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
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
// connectDB() called in startServer()

// API Routes
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webinars', webinarRoutes);
app.use('/api/course-students', courseStudentRoutes);



// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Brand Monk Academy API is running',
    database: {
      state: states[dbState] || 'unknown',
      host: mongoose.connection.host || 'none'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Brand Monk Academy API',
    endpoints: {
      students: '/api/students',
      admin: '/api/admin',
      webinars: '/api/webinars',
      health: '/api/health'
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

const startServer = async () => {
  try {
    // Attempt to connect to Database
    await connectDB();
    
    app.listen(PORT, () => {
      console.log('========================================');
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📍 API: http://localhost:${PORT}`);
      console.log('========================================');
    });

  } catch (error) {
    console.error('❌ Failed to connect to Database:', error.message);
    // Optional: Start server anyway to serve health check with error details? 
    // For now, let's allow it to start so we can debug via /api/health
    app.listen(PORT, () => console.log(`⚠️ Server running (DB Failed) on port ${PORT}`));
  }
};

startServer();

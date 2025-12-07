const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const webinarRoutes = require('./routes/webinarRoutes');

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

// Health check endpoint
  app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Brand Monk Academy API is running'
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

app.listen(PORT, () => {
  console.log('========================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}`);
  console.log('========================================');
});

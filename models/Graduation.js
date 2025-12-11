const mongoose = require('mongoose');

const attendeeSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  relation: {
    type: String,
    required: true,
    enum: ['Self', 'Friend', 'Father', 'Mother', 'Brother', 'Sister', 'Spouse', 'Other']
  }
}, { _id: true });

const graduationSchema = mongoose.Schema({
  // Student Details
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  batch: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  
  // Attendees (including the student)
  attendees: {
    type: [attendeeSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one attendee is required'
    }
  },
  
  // Seat allocation
  seatStart: {
    type: Number,
    required: true
  },
  seatEnd: {
    type: Number,
    required: true
  },
  totalSeats: {
    type: Number,
    required: true
  },
  
  registrationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to allocate seat numbers
graduationSchema.pre('save', async function() {
  if (!this.seatStart) {
    try {
      // Find the last graduation registration
      const lastGraduation = await mongoose.model('Graduation').findOne()
        .sort({ seatEnd: -1 });
      
      let nextSeatStart = 1;
      if (lastGraduation && lastGraduation.seatEnd) {
        nextSeatStart = lastGraduation.seatEnd + 1;
      }
      
      this.seatStart = nextSeatStart;
      this.totalSeats = this.attendees.length;
      this.seatEnd = nextSeatStart + this.totalSeats - 1;
    } catch (error) {
      throw error;
    }
  }
});

const Graduation = mongoose.model('Graduation', graduationSchema);

module.exports = Graduation;

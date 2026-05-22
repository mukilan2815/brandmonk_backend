const mongoose = require('mongoose');

const courseStudentSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  courseSlug: {
    type: String,
    required: true,
    trim: true
  },
  certificateId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: null
  },
  email: {
    type: String,
    trim: true,
    default: null,
    lowercase: true
  },
  batch: {
    type: String,
    trim: true,
    default: null
  },
  isEligible: {
    type: Boolean,
    default: true,
    index: true
  },
  certificateSent: {
    type: Boolean,
    default: false,
    index: true
  },
  certificateSentAt: {
    type: Date,
    default: null
  },
  dateOfRegistration: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for finding students by course
courseStudentSchema.index({ courseSlug: 1, createdAt: -1 });

// Compound index for finding eligible students
courseStudentSchema.index({ courseSlug: 1, isEligible: 1 });

const CourseStudent = mongoose.model('CourseStudent', courseStudentSchema);

module.exports = CourseStudent;

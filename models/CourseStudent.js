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
    required: true
  },
  isEligible: {
    type: Boolean,
    default: true
  },
  certificateSent: {
    type: Boolean,
    default: false
  },
  certificateSentAt: {
    type: Date,
    default: null
  },
  dateOfRegistration: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const CourseStudent = mongoose.model('CourseStudent', courseStudentSchema);

module.exports = CourseStudent;

const mongoose = require('mongoose');

const studentSchema = mongoose.Schema({
  name: {
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
  webinarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Webinar',
    required: false
  },
  webinarName: {
    type: String,
    required: true,
    trim: true
  },
  webinarSlug: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  profession: {
    type: String,
    required: true,
    enum: ['Student', 'Entrepreneur', 'Working Professional', 'Home Maker', 'Freelance', 'Others']
  },
  collegeOrCompany: {
    type: String,
    trim: true,
    default: ''
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  yearOfStudyOrExperience: {
    type: String,
    trim: true,
    default: ''
  },
  certificateId: {
    type: String,
    unique: true
  },
  isEligible: {
    type: Boolean,
    default: false
  },
  hasFollowedInstagram: {
    type: Boolean,
    default: false
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
  },
  certificateType: {
    type: String,
    enum: ['Standard', 'Government'],
    default: 'Standard'
  }
}, {
  timestamps: true
});



const Student = mongoose.model('Student', studentSchema);

module.exports = Student;

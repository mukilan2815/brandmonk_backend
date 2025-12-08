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
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate certificate ID
studentSchema.pre('save', async function(next) {
  if (!this.certificateId) {
    const count = await mongoose.model('Student').countDocuments();
    const sequenceNumber = (count + 1).toString().padStart(3, '0');
    this.certificateId = `SMAPARMQ076${sequenceNumber}`;
  }
  next();
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;

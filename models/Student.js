const mongoose = require('mongoose');

const studentSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  course: {
    type: String,
    required: true,
  },
  dateOfCompletion: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;

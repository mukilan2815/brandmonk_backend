const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true,
    enum: ['Chennai', 'Coimbatore']
  },
  role: {
    type: String,
    required: true,
    enum: ['viewer', 'manager'], // viewer = Chennai, manager = Coimbatore (can mark eligibility)
    default: 'viewer'
  }
}, {
  timestamps: true
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;

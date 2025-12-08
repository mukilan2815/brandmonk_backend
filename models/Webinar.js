const mongoose = require('mongoose');
const crypto = require('crypto');

const webinarSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['Webinar', 'Course'],
    default: 'Webinar',
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    trim: true,
    default: 'Online'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true
  },
  batchCode: {
    type: String,
    trim: true,
    default: ''
  },
  batchName: {
    type: String,
    trim: true,
    default: ''
  },
  trainer: {
    type: String,
    trim: true,
    default: ''
  },
  timing: {
    type: String,
    trim: true,
    default: ''
  },
  studentLimit: {
    type: Number,
    default: 0
  },
  totalRegistrations: {
    type: Number,
    default: 0

  }
}, {
  timestamps: true
});

// Generate unique slug before saving
webinarSchema.pre('save', function(next) {
  if (!this.slug) {
    // Generate slug from name + random string
    const nameSlug = this.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const randomStr = crypto.randomBytes(4).toString('hex');
    this.slug = `${nameSlug}-${randomStr}`;
  }
  next();
});

const Webinar = mongoose.model('Webinar', webinarSchema);

module.exports = Webinar;

const Webinar = require('../models/Webinar');
const { backupWebinar, logBackupEvent } = require('../services/firebaseBackup');

// Generate unique slug
const generateSlug = (name) => {
  const nameSlug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `${nameSlug}-${randomStr}`;
};

// @desc    Create a new webinar
// @route   POST /api/webinars
// @access  Private (Admin only)
const createWebinar = async (req, res) => {
  const { name, description, date, location, createdBy } = req.body;
  console.log("Create Webinar Request:", JSON.stringify(req.body, null, 2));

  if (!name || !date) {
    return res.status(400).json({
      success: false,
      message: 'Webinar name and date are required'
    });
  }

  // Validate date
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format'
    });
  }

  try {
    const slug = generateSlug(name);
    console.log("Generated slug:", slug);
    
    const webinarData = {
      name: name.trim(),
      slug: slug,
      type: req.body.type || 'Webinar',
      description: description?.trim() || '',
      date: dateObj,
      location: location?.trim() || 'Online',
      isActive: true,
      createdBy: createdBy || 'admin',
      batchCode: req.body.batchCode || '',
      batchName: req.body.batchName || '',
      trainer: req.body.trainer || '',
      timing: req.body.timing || '',
      studentLimit: req.body.studentLimit ? Number(req.body.studentLimit) : 0,
      totalRegistrations: 0,
      createdAt: new Date()
    };

    console.log("Saving webinar to MongoDB...");
    const webinar = new Webinar(webinarData);
    const savedWebinar = await webinar.save();
    console.log("Webinar saved successfully:", savedWebinar._id);
    
    // Backup to Firebase (fire-and-forget, don't block main operation)
    try {
      backupWebinar(savedWebinar).catch(err => console.error('Firebase backup error:', err.message));
    } catch (fbError) {
      console.error('Firebase backup invocation error:', fbError);
    }
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const registrationLink = `${frontendUrl}/register/${savedWebinar.slug}`;
    
    console.log("Registration Link:", registrationLink);
    
    res.status(201).json({
      success: true,
      message: 'Webinar created successfully!',
      webinar: {
        _id: savedWebinar._id,
        name: savedWebinar.name,
        slug: savedWebinar.slug,
        type: savedWebinar.type,
        description: savedWebinar.description,
        date: savedWebinar.date,
        location: savedWebinar.location,
        isActive: savedWebinar.isActive,
        totalRegistrations: savedWebinar.totalRegistrations || 0,
        createdAt: savedWebinar.createdAt,
        registrationLink: registrationLink
      },
      registrationLink: registrationLink
    });
  } catch (error) {
    console.error("Create Webinar Error:", error);
    
    // Handle specific Mongoose errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A webinar with this slug already exists. Please try again with a different name.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create webinar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all webinars
// @route   GET /api/webinars
// @access  Private (Admin only)
const getAllWebinars = async (req, res) => {
  try {
    const webinars = await Webinar.find({}).sort({ createdAt: -1 });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    const webinarsWithLinks = webinars.map(w => {
      const slug = w.slug || 'unknown';
      return {
        _id: w._id,
        name: w.name,
        slug: slug,
        type: w.type || 'Webinar',
        description: w.description,
        date: w.date,
        location: w.location,
        isActive: w.isActive,
        batchCode: w.batchCode,
        batchName: w.batchName,
        trainer: w.trainer,
        timing: w.timing,
        studentLimit: w.studentLimit,
        totalRegistrations: w.totalRegistrations || 0,
        createdAt: w.createdAt,
        registrationLink: `${frontendUrl}/register/${slug}`
      };
    });

    res.json({
      success: true,
      count: webinars.length,
      webinars: webinarsWithLinks
    });
  } catch (error) {
    console.error("GetAllWebinars Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch webinars'
    });
  }
};

// @desc    Get webinar by slug (for registration page)
// @route   GET /api/webinars/slug/:slug
// @access  Public
const getWebinarBySlug = async (req, res) => {
  const { slug } = req.params;
  console.log("Get Webinar by Slug:", slug);

  try {
    const webinar = await Webinar.findOne({ slug, isActive: true });

    if (webinar) {
      res.json({
        success: true,
        webinar: {
          _id: webinar._id,
          name: webinar.name,
          slug: webinar.slug,
          type: webinar.type || 'Webinar',
          description: webinar.description,
          date: webinar.date,
          location: webinar.location
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Webinar not found or registration closed'
      });
    }
  } catch (error) {
    console.error("GetWebinarBySlug Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch webinar'
    });
  }
};

// @desc    Toggle webinar active status
// @route   PATCH /api/webinars/:id/toggle
// @access  Private (Admin only)
const toggleWebinarStatus = async (req, res) => {
  const webinarId = req.params.id;
  console.log("Toggle Webinar Status:", webinarId);

  try {
    const webinar = await Webinar.findById(webinarId);
    
    if (webinar) {
      webinar.isActive = !webinar.isActive;
      await webinar.save();
      
      // Backup updated webinar to Firebase (fire-and-forget)
      backupWebinar(webinar).catch(err => console.error('Firebase backup error:', err.message));
      
      res.json({
        success: true,
        message: `Webinar ${webinar.isActive ? 'activated' : 'deactivated'}`,
        webinar
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Webinar not found'
      });
    }
  } catch (error) {
    console.error("ToggleWebinarStatus Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to update webinar'
    });
  }
};

// @desc    Delete webinar
// @route   DELETE /api/webinars/:id
// @access  Private (Admin only)
const deleteWebinar = async (req, res) => {
  const webinarId = req.params.id;
  console.log("Delete Webinar:", webinarId);

  try {
    const result = await Webinar.findByIdAndDelete(webinarId);

    if (result) {
      // Log deletion event to Firebase but DON'T delete the backup (fire-and-forget)
      logBackupEvent('WEBINAR_DELETED_FROM_MONGO', {
        webinarId,
        name: result.name,
        slug: result.slug,
        deletedAt: new Date().toISOString()
      }).catch(err => console.error('Firebase log error:', err.message));
      console.log(`📋 Webinar ${webinarId} deleted from MongoDB, backup preserved in Firebase`);
      
      res.json({
        success: true,
        message: 'Webinar deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Webinar not found'
      });
    }
  } catch (error) {
    console.error("DeleteWebinar Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete webinar'
    });
  }
};

// @desc    Update webinar details
// @route   PUT /api/webinars/:id
// @access  Private (Admin only)
const updateWebinar = async (req, res) => {
  const webinarId = req.params.id;
  console.log("Update Webinar:", webinarId, req.body);
  const { name, date, description, location } = req.body;

  try {
    const updateData = {
      ...(name && { name: name.trim() }),
      ...(req.body.type && { type: req.body.type }),
      ...(date && { date }),
      ...(description !== undefined && { description: description.trim() }),
      ...(location && { location: location.trim() })
    };

    const webinar = await Webinar.findByIdAndUpdate(webinarId, updateData, { new: true });

    if (webinar) {
      // Backup updated webinar to Firebase (fire-and-forget)
      backupWebinar(webinar).catch(err => console.error('Firebase backup error:', err.message));
      
      res.json({
        success: true,
        message: 'Webinar updated successfully!',
        webinar
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Webinar not found'
      });
    }
  } catch (error) {
    console.error("UpdateWebinar Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to update webinar'
    });
  }
};

module.exports = {
  createWebinar,
  getAllWebinars,
  getWebinarBySlug,
  updateWebinar,
  toggleWebinarStatus,
  deleteWebinar
};

const Webinar = require('../models/Webinar');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/webinars.json');

// Helper to ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Helper to read data
const readData = () => {
  try {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]');
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error("Error reading webinars file:", err);
    return [];
  }
};

// Helper to write data
const writeData = (data) => {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing webinars file:", err);
  }
};

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
  console.log("Create Webinar Request:", req.body);

  if (!name || !date) {
    return res.status(400).json({
      success: false,
      message: 'Webinar name and date are required'
    });
  }

  try {
    const slug = generateSlug(name);
    console.log("Generated slug:", slug);
    
    const webinarData = {
      name: name.trim(),
      slug: slug, // Always set the slug
      type: req.body.type || 'Webinar',
      description: description?.trim() || '',
      date: new Date(date),
      location: location?.trim() || 'Online',
      isActive: true,
      createdBy: createdBy || 'admin',
      totalRegistrations: 0,
      createdAt: new Date()
    };

    let savedWebinar;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Try MongoDB first
    try {
      const webinar = new Webinar(webinarData);
      savedWebinar = await webinar.save();
      
      // Backup to file
      const currentData = readData();
      writeData([...currentData, { 
        _id: savedWebinar._id.toString(),
        name: savedWebinar.name,
        slug: savedWebinar.slug,
        type: savedWebinar.type,
        description: savedWebinar.description,
        date: savedWebinar.date,
        location: savedWebinar.location,
        isActive: savedWebinar.isActive,
        createdBy: savedWebinar.createdBy,
        totalRegistrations: savedWebinar.totalRegistrations,
        createdAt: savedWebinar.createdAt
      }]);
      
      console.log("Webinar Created via MongoDB:", savedWebinar._id, "Slug:", savedWebinar.slug);
    } catch (dbError) {
      console.error("MongoDB failed, using local file storage:", dbError.message);
      
      // Fallback to file storage
      webinarData._id = Date.now().toString();
      const currentData = readData();
      writeData([...currentData, webinarData]);
      savedWebinar = webinarData;
      
      console.log("Webinar Created via Local File:", savedWebinar._id, "Slug:", savedWebinar.slug);
    }

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
    res.status(500).json({
      success: false,
      message: 'Failed to create webinar'
    });
  }
};

// @desc    Get all webinars
// @route   GET /api/webinars
// @access  Private (Admin only)
const getAllWebinars = async (req, res) => {
  try {
    let webinars = [];
    
    // Try MongoDB first
    try {
      const mongoWebinars = await Webinar.find({}).sort({ createdAt: -1 });
      webinars = mongoWebinars.map(w => w.toObject()); // Convert to plain objects
    } catch (e) {
      console.error("MongoDB GetAll Webinars Error:", e.message);
    }

    // Fallback to file
    if (webinars.length === 0) {
      webinars = readData().sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Add registration links
    const webinarsWithLinks = webinars.map(w => {
      const slug = w.slug || 'unknown';
      console.log("Webinar:", w.name, "Slug:", slug);
      return {
        _id: w._id,
        name: w.name,
        slug: slug,
        type: w.type || 'Webinar',
        description: w.description,
        date: w.date,
        location: w.location,
        isActive: w.isActive,
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
    let webinar = null;
    
    // Try MongoDB first
    try {
      webinar = await Webinar.findOne({ slug, isActive: true });
    } catch (e) {
      console.error("MongoDB GetBySlug Error:", e.message);
    }

    // Fallback to file
    if (!webinar) {
      const data = readData();
      webinar = data.find(w => w.slug === slug && w.isActive);
    }

    if (webinar) {
      res.json({
        success: true,
        webinar: {
          _id: webinar._id,
          name: webinar.name,
          slug: webinar.slug,
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
    let webinar = null;

    // Try MongoDB first
    try {
      if (webinarId.match(/^[0-9a-fA-F]{24}$/)) {
        webinar = await Webinar.findById(webinarId);
        if (webinar) {
          webinar.isActive = !webinar.isActive;
          await webinar.save();
        }
      }
    } catch (e) {
      console.error("MongoDB Toggle Error:", e.message);
    }

    // Fallback to file
    if (!webinar) {
      const data = readData();
      const index = data.findIndex(w => w._id === webinarId || w._id.toString() === webinarId);
      
      if (index !== -1) {
        data[index].isActive = !data[index].isActive;
        writeData(data);
        webinar = data[index];
      }
    }

    if (webinar) {
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
    let deleted = false;

    // Try MongoDB first
    try {
      if (webinarId.match(/^[0-9a-fA-F]{24}$/)) {
        const result = await Webinar.findByIdAndDelete(webinarId);
        if (result) deleted = true;
      }
    } catch (e) {
      console.error("MongoDB Delete Error:", e.message);
    }

    // Also delete from file
    const data = readData();
    const newData = data.filter(w => w._id !== webinarId && w._id.toString() !== webinarId);
    if (newData.length < data.length) {
      writeData(newData);
      deleted = true;
    }

    if (deleted) {
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
    let webinar = null;
    const updateData = {
      ...(name && { name: name.trim() }),
      ...(req.body.type && { type: req.body.type }),
      ...(date && { date }),
      ...(description !== undefined && { description: description.trim() }),
      ...(location && { location: location.trim() })
    };

    // Try MongoDB first
    try {
      if (webinarId.match(/^[0-9a-fA-F]{24}$/)) {
        webinar = await Webinar.findByIdAndUpdate(webinarId, updateData, { new: true });
      }
    } catch (e) {
      console.error("MongoDB Update Webinar Error:", e.message);
    }

    // Fallback to file
    if (!webinar) {
      const data = readData();
      const index = data.findIndex(w => w._id === webinarId || w._id.toString() === webinarId);
      
      if (index !== -1) {
        data[index] = { ...data[index], ...updateData };
        writeData(data);
        webinar = data[index];
      }
    }

    if (webinar) {
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

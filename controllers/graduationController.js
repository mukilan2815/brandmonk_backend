const Graduation = require('../models/Graduation');
const { backupToFirebase } = require('../services/firebaseBackup');

// Register for graduation celebration
exports.registerGraduation = async (req, res) => {
  try {
    const { studentName, email, phone, batch, course, attendees } = req.body;

    console.log('📝 Graduation Registration Request:', {
      studentName,
      email,
      batch,
      course,
      attendeesCount: attendees?.length
    });

    // Validate required fields
    if (!studentName || !email || !phone || !batch || !course || !attendees || attendees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required, including at least one attendee'
      });
    }

    // Create graduation registration
    const graduation = new Graduation({
      studentName,
      email,
      phone,
      batch,
      course,
      attendees
    });

    await graduation.save();

    console.log('✅ Graduation registered successfully:', {
      id: graduation._id,
      seats: `${String(graduation.seatStart).padStart(3, '0')} - ${String(graduation.seatEnd).padStart(3, '0')}`,
      totalSeats: graduation.totalSeats
    });

    // Attempt Firebase backup (non-blocking)
    try {
      await backupToFirebase('graduations', graduation);
    } catch (backupError) {
      console.error('⚠️ Firebase backup failed (non-critical):', backupError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Graduation registration successful!',
      data: {
        registrationId: graduation._id,
        seatStart: graduation.seatStart,
        seatEnd: graduation.seatEnd,
        totalSeats: graduation.totalSeats,
        seatNumbers: `${String(graduation.seatStart).padStart(3, '0')} to ${String(graduation.seatEnd).padStart(3, '0')}`
      }
    });
  } catch (error) {
    console.error('❌ Graduation registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message
    });
  }
};

// Get all graduation registrations (Admin)
exports.getAllGraduations = async (req, res) => {
  try {
    const graduations = await Graduation.find().sort({ registrationDate: -1 });

    const totalMembers = graduations.reduce((sum, grad) => sum + grad.totalSeats, 0);
    const totalSeats = totalMembers; // Same as total members

    res.json({
      success: true,
      count: graduations.length,
      totalMembers,
      totalSeats,
      data: graduations
    });
  } catch (error) {
    console.error('❌ Get graduations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch graduation records',
      error: error.message
    });
  }
};

// Get graduation stats (Admin)
exports.getGraduationStats = async (req, res) => {
  try {
    const graduations = await Graduation.find();

    const totalRegistrations = graduations.length;
    const totalMembers = graduations.reduce((sum, grad) => sum + grad.totalSeats, 0);

    // Count by course
    const courseStats = {};
    graduations.forEach(grad => {
      if (!courseStats[grad.course]) {
        courseStats[grad.course] = { registrations: 0, members: 0 };
      }
      courseStats[grad.course].registrations++;
      courseStats[grad.course].members += grad.totalSeats;
    });

    // Count by batch
    const batchStats = {};
    graduations.forEach(grad => {
      if (!batchStats[grad.batch]) {
        batchStats[grad.batch] = { registrations: 0, members: 0 };
      }
      batchStats[grad.batch].registrations++;
      batchStats[grad.batch].members += grad.totalSeats;
    });

    res.json({
      success: true,
      stats: {
        totalRegistrations,
        totalMembers,
        totalSeats: totalMembers,
        courseStats,
        batchStats,
        lastSeatNumber: graduations.length > 0 ? Math.max(...graduations.map(g => g.seatEnd)) : 0
      }
    });
  } catch (error) {
    console.error('❌ Get graduation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch graduation statistics',
      error: error.message
    });
  }
};

// Delete graduation registration (Admin)
exports.deleteGraduation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const graduation = await Graduation.findByIdAndDelete(id);
    
    if (!graduation) {
      return res.status(404).json({
        success: false,
        message: 'Graduation registration not found'
      });
    }

    res.json({
      success: true,
      message: 'Graduation registration deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete graduation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete graduation registration',
      error: error.message
    });
  }
};

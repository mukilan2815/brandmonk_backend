const QRCode = require('qrcode');
const CourseStudent = require('../models/CourseStudent');

class CertificateService {
  // Generate unique certificate ID based on course and sequence
  static async generateCertificateId(courseSlug) {
    try {
      const count = await CourseStudent.countDocuments({ courseSlug });

      // Prefix mapping: video-editing -> BMAVE, digital-marketing -> BMADM
      const prefixMap = {
        'video-editing': 'BMAVE',
        'digital-marketing': 'BMADM',
        'web-development': 'BMAWD',
        'graphic-design': 'BMAGD',
        'social-media': 'BMASMS'
      };

      const prefix = prefixMap[courseSlug] || 'BMA' + courseSlug.substring(0, 3).toUpperCase();
      const sequenceNumber = (count + 1).toString().padStart(5, '0');

      return `${prefix}${sequenceNumber}`;
    } catch (error) {
      console.error('Error generating certificate ID:', error);
      throw error;
    }
  }

  // Generate QR code data URL
  static async generateQRCode(certificateId, verificationUrl) {
    try {
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  // Create or update a course student with certificate
  static async createCourseStudent(studentData) {
    const {
      name,
      courseName,
      courseSlug,
      phoneNumber = null,
      email = null,
      batch = null,
      isEligible = true
    } = studentData;

    if (!name || !courseName || !courseSlug) {
      throw new Error('Name, courseName, and courseSlug are required');
    }

    try {
      // Check if student already exists
      const existingStudent = await CourseStudent.findOne({
        name: name.trim(),
        courseSlug: courseSlug.trim()
      });

      if (existingStudent) {
        console.log(`Student ${name} already exists in ${courseSlug}`);
        return {
          success: false,
          message: 'Student already exists',
          student: existingStudent,
          isNew: false
        };
      }

      // Generate certificate ID
      const certificateId = await this.generateCertificateId(courseSlug);

      // Create new student
      const student = new CourseStudent({
        name: name.trim(),
        courseName: courseName.trim(),
        courseSlug: courseSlug.trim(),
        certificateId,
        phoneNumber: phoneNumber ? phoneNumber.trim() : null,
        email: email ? email.trim() : null,
        batch: batch ? batch.trim() : null,
        isEligible,
        dateOfRegistration: new Date()
      });

      const savedStudent = await student.save();

      return {
        success: true,
        message: 'Student added successfully',
        student: savedStudent,
        isNew: true
      };
    } catch (error) {
      console.error('Error creating course student:', error);
      throw error;
    }
  }

  // Bulk create course students
  static async bulkCreateCourseStudents(studentsData) {
    const results = {
      success: [],
      failed: [],
      skipped: [],
      totalProcessed: 0
    };

    for (const studentData of studentsData) {
      try {
        const result = await this.createCourseStudent(studentData);

        if (result.isNew) {
          results.success.push({
            name: studentData.name,
            certificateId: result.student.certificateId,
            course: studentData.courseName
          });
        } else {
          results.skipped.push({
            name: studentData.name,
            reason: 'Already exists'
          });
        }
      } catch (error) {
        results.failed.push({
          name: studentData.name,
          error: error.message
        });
      }
      results.totalProcessed++;
    }

    return results;
  }

  // Get verification data for a certificate
  static async getVerificationData(certificateId) {
    try {
      const student = await CourseStudent.findOne({ certificateId });

      if (!student) {
        return null;
      }

      return {
        _id: student._id.toString(),
        name: student.name,
        courseName: student.courseName,
        courseSlug: student.courseSlug,
        certificateId: student.certificateId,
        batch: student.batch,
        email: student.email,
        isEligible: student.isEligible,
        dateOfRegistration: student.dateOfRegistration || student.createdAt,
        certificateSent: student.certificateSent,
        certificateSentAt: student.certificateSentAt
      };
    } catch (error) {
      console.error('Error getting verification data:', error);
      throw error;
    }
  }

  // Mark certificate as sent (e.g., via email)
  static async markCertificateAsSent(certificateId) {
    try {
      const updatedStudent = await CourseStudent.findOneAndUpdate(
        { certificateId },
        {
          certificateSent: true,
          certificateSentAt: new Date()
        },
        { new: true }
      );

      return updatedStudent;
    } catch (error) {
      console.error('Error marking certificate as sent:', error);
      throw error;
    }
  }

  // Get students by course
  static async getStudentsByCourse(courseSlug) {
    try {
      const students = await CourseStudent.find({ courseSlug })
        .sort({ createdAt: -1 });

      return students.map(s => ({
        _id: s._id.toString(),
        name: s.name,
        courseName: s.courseName,
        courseSlug: s.courseSlug,
        certificateId: s.certificateId,
        phoneNumber: s.phoneNumber,
        email: s.email,
        batch: s.batch,
        isEligible: s.isEligible,
        certificateSent: s.certificateSent,
        dateOfRegistration: s.dateOfRegistration,
        createdAt: s.createdAt
      }));
    } catch (error) {
      console.error('Error getting students by course:', error);
      throw error;
    }
  }

  // Update student eligibility
  static async updateEligibility(certificateId, isEligible) {
    try {
      const updatedStudent = await CourseStudent.findOneAndUpdate(
        { certificateId },
        { isEligible },
        { new: true }
      );

      return updatedStudent;
    } catch (error) {
      console.error('Error updating eligibility:', error);
      throw error;
    }
  }
}

module.exports = CertificateService;

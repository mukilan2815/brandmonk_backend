const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { createCanvas, loadImage, registerFont } = require('canvas');
const QRCode = require('qrcode');
const Student = require('../models/Student');
require('dotenv').config();

// Configuration
const TEMPLATE_PATH = path.join(__dirname, '../templates/certificate_template.png');
const OUTPUT_DIR = path.join(__dirname, '../certificates');
const QR_X = 338;
const QR_Y = 805;
const QR_SIZE = 63; // Slightly larger to cover
// Name configuration (Guessing)
const NAME_Y = 560; // Approximate center Y based on visual inspection of similar certs
const FONT_SIZE = 50; // Initial font size

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const generateCertificates = async () => {
    await connectDB();

    const students = await Student.find({});
    console.log(`Found ${students.length} students.`);

    // Load Template
    const template = await loadImage(TEMPLATE_PATH);
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');

    let count = 0;

    for (const student of students) {
        // Redraw template
        ctx.drawImage(template, 0, 0);

        // 1. Generate QR
        // URL: FRONTEND_URL/verify/STUDENT_ID
        // Verify URL format with user if possible, assuming /verify/:id
         const verifyUrl = `${process.env.FRONTEND_URL || 'https://brand-monk.vercel.app'}/verify/${student._id}`;
        // const verifyUrl = `https://brand-monk.vercel.app/verify/${student._id}`;
        
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 0 });
        const qrImage = await loadImage(qrDataUrl);

        // Draw QR
        ctx.drawImage(qrImage, QR_X, QR_Y, QR_SIZE, QR_SIZE);

        // 2. Draw Name
        // Clear existing name area if needed? The template might have a dummy name.
        // Assuming the provided template has "SABAREESAN PONNUVEL" which needs to be covered.
        // I will draw a white rectangle over the name area first.
        
        ctx.fillStyle = '#FFFFFF';
        // Approximate name area to clear
        const clearWidth = 800;
        const clearHeight = 100;
        const clearX = (canvas.width - clearWidth) / 2;
        const clearY = NAME_Y - 60; // Adjust based on alignment
        ctx.fillRect(clearX, clearY, clearWidth, clearHeight);

        // Draw Name text
        ctx.font = `bold ${FONT_SIZE}px Arial`;
        ctx.fillStyle = '#9e3e36'; // Dark Red/Brown color picked from image approx
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Convert name to Title Case or UPPERCASE as per sample? Sample is UPPERCASE.
        const displayName = student.name.toUpperCase();
        ctx.fillText(displayName, canvas.width / 2, NAME_Y);

        // Save
        const safeName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(path.join(OUTPUT_DIR, `${safeName}_${student.certificateId}.png`), buffer);
        
        count++;
        if(count % 10 === 0) console.log(`Generated ${count} certificates...`);
    }

    console.log(`Finished generating ${count} certificates.`);
    process.exit();
};

generateCertificates();

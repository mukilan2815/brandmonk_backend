const fs = require('fs');
const PNG = require('pngjs').PNG;
const jsQR = require('jsqr');
const path = require('path');

const imagePath = path.join(__dirname, '../templates/certificate_template.png');

console.log('Reading image from:', imagePath);

try {
    const buffer = fs.readFileSync(imagePath);
    const png = PNG.sync.read(buffer);
    const code = jsQR(png.data, png.width, png.height);

    if (code) {
        console.log('QR Code FOUND');
        console.log('Location:', JSON.stringify(code.location));
        console.log('Data:', code.data);
        console.log('Center:', {
             x: (code.location.topRightCorner.x + code.location.bottomLeftCorner.x) / 2,
             y: (code.location.topRightCorner.y + code.location.bottomLeftCorner.y) / 2
        });
        console.log('Dimensions:', {
            width: code.location.topRightCorner.x - code.location.topLeftCorner.x,
            height: code.location.bottomLeftCorner.y - code.location.topLeftCorner.y
        });
    } else {
        console.log('No QR code found in the image.');
    }
} catch (e) {
    console.error('Error:', e.message);
}

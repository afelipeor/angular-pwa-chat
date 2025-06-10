const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Icon sizes for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../src/assets/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for the chat app icon
const svgTemplate = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1976d2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#42a5f5;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background circle -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${
  size / 2
}" fill="url(#gradient)"/>

  <!-- Chat bubble main -->
  <rect x="${size * 0.2}" y="${size * 0.25}" width="${size * 0.5}" height="${
  size * 0.35
}" rx="${size * 0.08}" fill="white" opacity="0.9"/>

  <!-- Chat bubble tail -->
  <polygon points="${size * 0.2},${size * 0.55} ${size * 0.15},${size * 0.65} ${
  size * 0.2
},${size * 0.6}" fill="white" opacity="0.9"/>

  <!-- Chat lines -->
  <line x1="${size * 0.28}" y1="${size * 0.35}" x2="${size * 0.62}" y2="${
  size * 0.35
}" stroke="#1976d2" stroke-width="${size * 0.02}" stroke-linecap="round"/>
  <line x1="${size * 0.28}" y1="${size * 0.45}" x2="${size * 0.55}" y2="${
  size * 0.45
}" stroke="#1976d2" stroke-width="${size * 0.02}" stroke-linecap="round"/>
  <line x1="${size * 0.28}" y1="${size * 0.52}" x2="${size * 0.48}" y2="${
  size * 0.52
}" stroke="#1976d2" stroke-width="${size * 0.02}" stroke-linecap="round"/>
</svg>`;

// Generate SVG icons
function generateSVGIcons() {
  iconSizes.forEach((size) => {
    const svgContent = svgTemplate(size);
    const filePath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    fs.writeFileSync(filePath, svgContent.trim());
    console.log(`Generated SVG: icon-${size}x${size}.svg`);
  });
}

// Generate PNG icons from SVG
async function generatePNGIcons() {
  const sharp = require('sharp');

  for (const size of iconSizes) {
    try {
      const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
      const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);

      await sharp(svgPath).png().resize(size, size).toFile(pngPath);

      console.log(`Generated PNG: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`Error generating PNG for size ${size}:`, error);
    }
  }
}

// Alternative PNG generation using canvas (if sharp is not available)
function generatePNGWithCanvas() {
  iconSizes.forEach((size) => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#1976d2');
    gradient.addColorStop(1, '#42a5f5');

    // Background circle
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Chat bubble
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.roundRect(
      size * 0.2,
      size * 0.25,
      size * 0.5,
      size * 0.35,
      size * 0.08
    );
    ctx.fill();

    // Chat lines
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = size * 0.02;
    ctx.lineCap = 'round';

    // Line 1
    ctx.beginPath();
    ctx.moveTo(size * 0.28, size * 0.35);
    ctx.lineTo(size * 0.62, size * 0.35);
    ctx.stroke();

    // Line 2
    ctx.beginPath();
    ctx.moveTo(size * 0.28, size * 0.45);
    ctx.lineTo(size * 0.55, size * 0.45);
    ctx.stroke();

    // Line 3
    ctx.beginPath();
    ctx.moveTo(size * 0.28, size * 0.52);
    ctx.lineTo(size * 0.48, size * 0.52);
    ctx.stroke();

    // Save PNG
    const buffer = canvas.toBuffer('image/png');
    const filePath = path.join(iconsDir, `icon-${size}x${size}.png`);
    fs.writeFileSync(filePath, buffer);
    console.log(`Generated PNG with Canvas: icon-${size}x${size}.png`);
  });
}

// Main execution
async function generateIcons() {
  console.log('Generating PWA icons...');

  // Generate SVG icons
  generateSVGIcons();

  // Try to generate PNG with Sharp, fallback to Canvas
  try {
    await generatePNGIcons();
  } catch (error) {
    console.log('Sharp not available, using Canvas fallback...');
    generatePNGWithCanvas();
  }

  console.log('Icon generation complete!');
}

// Run if called directly
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons };

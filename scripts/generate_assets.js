import fs from 'fs';
import path from 'path';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Minimal valid 1x1 or small image buffer for JPEG and GIF
// We can generate valid small JPEG and GIF binaries, or SVG with image extension
// A minimal valid 1x1 GIF:
const minimalGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
// A minimal valid 1x1 JPEG:
const minimalJpeg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');

['public/assets', 'assets'].forEach(dir => {
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, 'portada.jpg'), minimalJpeg);
  fs.writeFileSync(path.join(dir, 'victoria.jpg'), minimalJpeg);
  fs.writeFileSync(path.join(dir, 'derrota.jpg'), minimalJpeg);
  fs.writeFileSync(path.join(dir, 'intro.gif'), minimalGif);
  fs.writeFileSync(path.join(dir, 'intro.mp4'), Buffer.from(''));
});

console.log('Assets created successfully');

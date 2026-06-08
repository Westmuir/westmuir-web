import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';

// 1. Scan and find all files inside your local source directories
const images = fg.sync(['src/images/events/**/*.{jpg,jpeg,png,webp,avif}', '!_site']);
const galleries = {};

images.forEach(filePath => {
  const dirPath = path.dirname(filePath);
  const folderName = path.basename(dirPath);
  const fileName = path.basename(filePath, path.extname(filePath));

  if (fileName === 'captions') return;

  if (!galleries[folderName]) {
    galleries[folderName] = [];
  }

  let captionText = fileName.replace(/[-_]/g, ' ');
  const captionsPath = path.join(dirPath, 'captions.json');
  if (fs.existsSync(captionsPath)) {
    const customCaptions = JSON.parse(fs.readFileSync(captionsPath, 'utf8'));
    if (customCaptions[fileName]) {
      captionText = customCaptions[fileName];
    }
  }

  galleries[folderName].push({
    src: '/' + filePath.replace(/^src\//, ''),
    alt: captionText,
  });
});

// 2. Export the global master collection tree
export default galleries;

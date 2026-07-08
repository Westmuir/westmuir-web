import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';

// 1. Scan everything inside a general galleries directory
const images = fg.sync(['src/images/galleries/**/*.{jpg,jpeg,png,webp,avif}', '!_site']);
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

export default galleries;

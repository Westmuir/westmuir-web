import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';

// 1. Scan everything inside a general galleries directory
const images = fg.sync(['src/images/galleries/**/*.{jpg,jpeg,png,webp,avif}', '!_site']);
const galleries = {};

// Group raw images by folder layout bucket
const groupedImages = {};

images.forEach(filePath => {
  const dirPath = path.dirname(filePath);
  const folderName = path.basename(dirPath);
  const fileName = path.basename(filePath, path.extname(filePath));

  if (fileName === 'captions') return;

  if (!groupedImages[folderName]) {
    groupedImages[folderName] = [];
  }

  groupedImages[folderName].push({ filePath, fileName, dirPath });
});

// Process each gallery folder
Object.keys(groupedImages).forEach(folderName => {
  const items = groupedImages[folderName];
  let hasFeature = false;
  let mediumCount = 0;

  // Track the raw JSON key array sequence to respect manual ordering in captions.json
  let jsonOrderMap = [];
  const captionsPath = path.join(items[0].dirPath, 'captions.json');
  if (fs.existsSync(captionsPath)) {
    try {
      const parsedJson = JSON.parse(fs.readFileSync(captionsPath, 'utf8'));
      jsonOrderMap = Object.keys(parsedJson);
    } catch (e) {
      console.error(`Error parsing captions.json in ${folderName}:`, e);
    }
  }

  // PASS 1: Extract files, apply configurations, determine explicit custom sizes
  const processedItems = items.map((item, fileIndex) => {
    let titleText = item.fileName.replace(/[-_]/g, ' ');
    let descText = '';
    let customSize = '';
    let shouldHoist = true; // Default behavior: components scale and float upwards

    if (jsonOrderMap.length > 0) {
      const captionsPath = path.join(item.dirPath, 'captions.json');
      const customCaptions = JSON.parse(fs.readFileSync(captionsPath, 'utf8'));

      if (customCaptions[item.fileName]) {
        const entry = customCaptions[item.fileName];

        if (typeof entry === 'string') {
          titleText = entry;
        } else if (typeof entry === 'object' && entry !== null) {
          titleText = entry.title || entry.text || titleText;
          descText = entry.desc || entry.description || '';

          if (entry.hoist === false) {
            shouldHoist = false;
          }

          if (entry.size === 'feature' || entry.bentoSize === 'feature') {
            customSize = 'feature';
            hasFeature = true;
          } else if (entry.size === 'medium' || entry.bentoSize === 'medium') {
            customSize = 'medium';
            mediumCount++;
          } else if (entry.size === 'standard') {
            customSize = 'standard';
          }
        }
      }
    }

    // Determine position index in the JSON configuration file (-1 if unlisted)
    const jsonSequenceIndex = jsonOrderMap.indexOf(item.fileName);

    return {
      src: '/' + item.filePath.replace(/^src\//, ''),
      alt: titleText,
      title: titleText,
      desc: descText,
      bentoSize: customSize,
      hadCustomSize: customSize !== '',
      shouldHoist,
      jsonSequenceIndex,
      fileIndex, // Natural baseline file sorting index
    };
  });

  // PASS 2: Dynamic slot backfilling (Runs on the original list before sorting)
  processedItems.forEach(item => {
    if (item.hadCustomSize) {
      if (item.bentoSize === 'standard') item.bentoSize = '';
      return;
    }

    if (!hasFeature) {
      item.bentoSize = 'feature';
      hasFeature = true;
    } else if (mediumCount < 2) {
      item.bentoSize = 'medium';
      mediumCount++;
    } else {
      item.bentoSize = '';
    }
  });

  // PASS 3: The Deferred Sorting Engine
  processedItems.sort((a, b) => {
    // Rule A: Priority handling for elements listed in the captions.json file
    const aInJson = a.jsonSequenceIndex !== -1;
    const bInJson = b.jsonSequenceIndex !== -1;

    if (aInJson && bInJson) {
      // Both are in JSON: Preserve the exact structural line order written in captions.json
      return a.jsonSequenceIndex - b.jsonSequenceIndex;
    }
    if (aInJson && !bInJson) return -1; // Push JSON-defined entries ahead of unlisted items
    if (!aInJson && bInJson) return 1;

    // Rule B: Handle elements where hoisting is explicitly disabled
    if (a.shouldHoist !== b.shouldHoist) {
      return a.shouldHoist ? -1 : 1; // Float hoists above non-hoists
    }

    // Rule C: Size-based layout layout ordering (Feature -> Medium -> Standard)
    if (a.shouldHoist && b.shouldHoist) {
      const sizeWeight = { feature: 3, medium: 2, '': 0 };
      const weightA = sizeWeight[a.bentoSize] || 0;
      const weightB = sizeWeight[b.bentoSize] || 0;

      if (weightA !== weightB) {
        return weightB - weightA; // Descending size hierarchy distribution
      }
    }

    // Rule D: Fall back to natural alphanumeric filesystem arrangement
    return a.fileIndex - b.fileIndex;
  });

  galleries[folderName] = processedItems;
});

export default galleries;

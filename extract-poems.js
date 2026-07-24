import fs from 'node:fs';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';

const srcDir = './pdf-source';
const destDir = './src/poems';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Silo individual file processing into an isolated synchronous task boundary
async function processSingleFile(file) {
  const filePath = path.join(srcDir, file);
  const dataBuffer = fs.readFileSync(filePath);
  let parser = null;

  try {
    parser = new PDFParse({ data: dataBuffer });

    // 1. Text Parsing
    const rawText = await parser.getText();
    const fileNameText = path.basename(file, '.pdf');
    const folderSlug = slugify(fileNameText);

    const poemFolder = path.join(destDir, folderSlug);
    if (!fs.existsSync(poemFolder)) {
      fs.mkdirSync(poemFolder, { recursive: true });
    }

    // 2. Image Retrieval Matrix
    let imageMarkdownList = '';
    const result = await parser.getImage();

    if (result && Array.isArray(result.pages)) {
      let imageCounter = 0;
      for (const page of result.pages) {
        if (!page.images || !Array.isArray(page.images)) continue;

        for (const img of page.images) {
          const bufferPayload = img.data || img.imageBuffer;
          if (!bufferPayload) continue;

          const imgName = `image-${imageCounter}.png`;
          const imgPath = path.join(poemFolder, imgName);

          fs.writeFileSync(imgPath, bufferPayload);
          imageMarkdownList += `\n# Extracted Asset reference: <img src="./${imgName}">`;
          imageCounter++;
        }
      }
    }

    // 3. Document Template Writing
    const output = `---
title: "${fileNameText}"
layout: "poem-layout.webc"
---

<!-- EXTRACTED IMAGES REFERENCE:
     Copy and paste these images into their correct template slots below!${imageMarkdownList}
-->

${rawText.text.trim()}
`;

    const destPath = path.join(poemFolder, 'index.md');
    fs.writeFileSync(destPath, output);
    console.log(`Successfully Extracted: ${file} -> Folder: ${folderSlug}/`);
  } catch (err) {
    console.error(`❌ Skipped/Failed processing file "${file}":`, err.message || err);
  } finally {
    if (parser) {
      try {
        await parser.destroy(); // Strictly release core system worker thread memory blocks
      } catch (destroyErr) {
        // Suppress destroy thread collisions from interrupting loop execution
      }
    }
  }
}

async function runExtraction() {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  try {
    // Read and enforce alphabetical sorting to track file sequence accurately
    const files = fs.readdirSync(srcDir).sort((a, b) => a.localeCompare(b));

    console.log(`Found ${files.filter(f => path.extname(f).toLowerCase() === '.pdf').length} PDFs to extract.`);

    for (const file of files) {
      if (path.extname(file).toLowerCase() !== '.pdf') continue;

      // Execute each file sequentially, completely awaiting resolution before starting next loop
      await processSingleFile(file);
    }

    console.log('🎉 Complete extraction sequence finished!');
  } catch (err) {
    console.error(`Error reading source directory:`, err);
  }
}

runExtraction();

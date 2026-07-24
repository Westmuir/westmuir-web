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

    // 2. Image Extraction Matrix with Safety Timeout
    const imagePathsList = [];
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Image extraction timed out')), 3000),
    );

    try {
      const result = await Promise.race([parser.getImage(), timeoutPromise]);

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

            // Store bulletproof root-relative paths for WebC/Eleventy Image compatibility
            imagePathsList.push(`/poems/${folderSlug}/${imgName}`);
            imageCounter++;
          }
        }
      }
    } catch (imageErr) {
      console.warn(`⚠️ Skipped images for "${file}" (${imageErr.message}). Text still saved.`);
    }

    // 3. Smart Image Placement Matrix Distributor
    // We assume 2 headers, 3 middle images, and the rest split down the side lanes
    let headerTlHtml = '<img src="/images/poems/happy-2020.png" alt="" slot="header-tl" />';
    let headerTrHtml = '<img src="/images/poems/happy-2020.png" alt="" slot="header-tr" />';
    const col1Images = [];
    const col3Images = [];
    const col5Images = [];

    imagePathsList.forEach((src, idx) => {
      if (idx === 0) {
        headerTlHtml = `<img src="${src}" alt="" slot="header-tl" />`;
      } else if (idx === 1) {
        headerTrHtml = `<img src="${src}" alt="" slot="header-tr" />`;
      } else if (idx >= 2 && idx <= 4) {
        // Next 3 items fill the center lane
        col3Images.push(`    <img src="${src}" alt="" />`);
      } else {
        // Alternate remaining files between outer lanes 1 and 5
        if (idx % 2 === 0) {
          col1Images.push(`    <img src="${src}" alt="" />`);
        } else {
          col5Images.push(`    <img src="${src}" alt="" />`);
        }
      }
    });

    // 4. Smart Line-Counting Stanza Engine (4 Lines Per Stanza)
    const allLines = rawText.text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('--') && !line.endsWith('--'));

    const formattedStanzas = [];
    const linesPerStanza = 4;

    for (let i = 0; i < allLines.length; i += linesPerStanza) {
      const stanzaLines = allLines.slice(i, i + linesPerStanza);

      // Stop rendering regular grid tracks if we bump directly into the author footer signature
      const joinedSegment = stanzaLines.join(' ').toLowerCase();
      if (joinedSegment.includes('eila webster')) {
        break;
      }

      const stanzaHtml = `    <p>\n      ${stanzaLines.join(' <br />\n      ')}\n    </p>`;
      formattedStanzas.push(stanzaHtml);
    }

    // Calculate 50/50 grid track distribution
    const totalStanzas = formattedStanzas.length;
    const col2Count = Math.ceil(totalStanzas / 2);

    const col2StanzasHtml = formattedStanzas.slice(0, col2Count).join('\n\n');
    const col4StanzasHtml = formattedStanzas.slice(col2Count).join('\n\n');

    // 5. Document Template Writing (.webc)
    const output = `---
layout: "base.webc"
title: "${fileNameText}"
poemTitle: "${fileNameText}"
author: "Eila Webster"
bgTheme: "antiquewhite"
endOfYear: false
---
<div class="full-width">
<poem-grid :title="poemTitle" :author="author" :theme="bgTheme">

  <!-- Header Section -->
  ${headerTlHtml}
  ${headerTrHtml}

  <!-- Column 1 Images (15%) -->
  <div slot="col-1-images">
${col1Images.join('\n') || '    <!-- No side images -->'}
  </div>

  <!-- Column 2 Text -->
  <div slot="col-2-text">
${col2StanzasHtml || '    <!-- No stanzas assigned -->'}
  </div>

  <!-- Column 3 Middle Images -->
  <div slot="col-3-images">
${col3Images.join('\n') || '    <!-- No center images -->'}
  </div>

  <!-- Column 4 Text -->
  <div slot="col-4-text">
${col4StanzasHtml || '    <!-- No stanzas assigned -->'}
  </div>

  <!-- Column 5 Images (15%) -->
  <div slot="col-5-images">
${col5Images.join('\n') || '    <!-- No side images -->'}
  </div>

</poem-grid>
</div>
`;

    const destPath = path.join(poemFolder, 'index.webc');
    fs.writeFileSync(destPath, output);
    console.log(`Successfully Extracted: ${file} -> Folder: ${folderSlug}/`);
  } catch (err) {
    console.error(`❌ Skipped/Failed processing file "${file}":`, err.message || err);
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (destroyErr) {
        // Suppress destroy errors from interrupting loop
      }
    }
  }
}

async function runExtraction() {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  try {
    const files = fs.readdirSync(srcDir).sort((a, b) => a.localeCompare(b));
    console.log(`Found ${files.filter(f => path.extname(f).toLowerCase() === '.pdf').length} PDFs to extract.`);

    for (const file of files) {
      if (path.extname(file).toLowerCase() !== '.pdf') continue;
      await processSingleFile(file);
    }

    console.log('🎉 Complete extraction sequence finished!');
  } catch (err) {
    console.error(`Error reading source directory:`, err);
  }
}

runExtraction();

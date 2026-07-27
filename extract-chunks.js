// extract-chunks.js — run once: node extract-chunks.js
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const CHUNK_SIZE_CHARS = 1800;
const OVERLAP_CHARS = 360;

async function main() {
  const buffer = fs.readFileSync(path.join(__dirname, 'Demo.pdf'));
  console.log('Parsing PDF...');
  const data = await pdfParse(buffer);
  const numPages = data.numpages;
  console.log(`Extracted ${data.text.length} chars from ${numPages} pages.`);

  const cleaned = data.text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const pageTexts = cleaned.split(/\f+/);
  const chunks = [];
  let chunkId = 0;

  for (let pageIndex = 0; pageIndex < pageTexts.length; pageIndex++) {
    const pageText = pageTexts[pageIndex].trim();
    const pageNum = pageIndex + 1;
    let start = 0;
    while (start < pageText.length) {
      const end = Math.min(start + CHUNK_SIZE_CHARS, pageText.length);
      let slice = pageText.slice(start, end);
      const sentenceEnd = slice.lastIndexOf('. ');
      if (sentenceEnd > CHUNK_SIZE_CHARS * 0.6) slice = slice.slice(0, sentenceEnd + 1);
      const text = slice.trim();
      if (text.length > 100) chunks.push({ id: `chunk_${chunkId++}`, page: pageNum, text });
      start += slice.length - OVERLAP_CHARS;
      if (start < 0) start = 0;
    }
  }

  console.log(`Created ${chunks.length} chunks.`);
  const out = { chapter: 'Journal', subject: 'Accountancy', grade: 11, board: 'CBSE', totalChunks: chunks.length, chunks };
  fs.writeFileSync(path.join(__dirname, 'public', 'lesson-chunks.json'), JSON.stringify(out, null, 2));
  console.log('Saved to public/lesson-chunks.json');
}
main().catch(console.error);

#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { buildBook } = require('./build-html-book');

async function generatePDF() {
  console.log('🚀 Building PDF version...');
  
  // First build the HTML version
  await buildBook();
  
  const htmlPath = path.join(__dirname, '..', 'dist', 'clide-handbook.html');
  const pdfPath = path.join(__dirname, '..', 'dist', 'clide-handbook.pdf');
  
  // Launch headless browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Load the HTML file
    const htmlContent = await fs.readFile(htmlPath, 'utf-8');
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });
    
    // Generate PDF with print-friendly settings
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width: 100%; font-size: 10px; padding: 5px 0; text-align: center; color: #666;">
          <span class="title"></span>
        </div>
      `,
      footerTemplate: `
        <div style="width: 100%; font-size: 10px; padding: 5px 0; text-align: center; color: #666;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `
    });
    
    console.log(`✅ PDF generated successfully!`);
    console.log(`📄 Output: ${pdfPath}`);
    
  } finally {
    await browser.close();
  }
}

// Run PDF generation
if (require.main === module) {
  generatePDF().catch(error => {
    console.error('PDF generation failed:', error);
    process.exit(1);
  });
}

module.exports = { generatePDF };
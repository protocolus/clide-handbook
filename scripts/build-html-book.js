#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');
const hljs = require('highlight.js');
const { JSDOM } = require('jsdom');

// Configure marked with syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error(`Error highlighting ${lang}:`, err);
      }
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

// Book metadata
const BOOK_TITLE = 'The Clide Handbook';
const BOOK_SUBTITLE = 'Autonomous Development with Claude Code';
const AUTHOR = 'Claude Code Community';

// Chapter order
const CHAPTER_ORDER = [
  '00-introduction.md',
  '01-foundations-of-autonomous-development.md',
  '02-understanding-claude-code.md',
  '03-setting-up-your-environment.md',
  '04-custom-commands-architecture.md',
  '05-git-worktree-mastery.md',
  '06-the-testing-first-philosophy.md',
  '07-the-issue-to-pr-pipeline.md',
  '08-advanced-command-patterns.md',
  '09-tool-permissions-and-security.md',
  '10-conclusion.md',
  '11-automated-issue-detection-and-dispatch.md'
];

// Generate CSS for the book
function generateCSS() {
  return `
    /* Reset and Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* Typography - Technical Book Style */
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Inter:wght@400;500;600;700&display=swap');

    :root {
      /* Color Scheme */
      --color-bg: #ffffff;
      --color-text: #1a1a1a;
      --color-text-muted: #666666;
      --color-accent: #0066cc;
      --color-accent-hover: #0052a3;
      --color-code-bg: #f6f8fa;
      --color-code-border: #e1e4e8;
      --color-blockquote-bg: #f0f7ff;
      --color-blockquote-border: #0066cc;
      --color-warning-bg: #fff8e1;
      --color-warning-border: #ffb700;
      --color-success-bg: #e8f5e9;
      --color-success-border: #4caf50;
      
      /* Typography */
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'IBM Plex Mono', 'Consolas', 'Monaco', monospace;
      
      /* Spacing */
      --space-xs: 0.25rem;
      --space-sm: 0.5rem;
      --space-md: 1rem;
      --space-lg: 1.5rem;
      --space-xl: 2rem;
      --space-2xl: 3rem;
      --space-3xl: 4rem;
      
      /* Layout */
      --max-width: 900px;
      --sidebar-width: 280px;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      :root {
        --color-bg: #0d1117;
        --color-text: #e6edf3;
        --color-text-muted: #8b949e;
        --color-accent: #58a6ff;
        --color-accent-hover: #79c0ff;
        --color-code-bg: #161b22;
        --color-code-border: #30363d;
        --color-blockquote-bg: #0d1117;
        --color-blockquote-border: #58a6ff;
        --color-warning-bg: #2d2200;
        --color-warning-border: #9e6a03;
        --color-success-bg: #0a2e0a;
        --color-success-border: #238636;
      }
    }

    body {
      font-family: var(--font-sans);
      font-size: 16px;
      line-height: 1.7;
      color: var(--color-text);
      background-color: var(--color-bg);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Layout Container */
    .book-container {
      display: flex;
      min-height: 100vh;
    }

    /* Table of Contents Sidebar */
    .toc-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: var(--sidebar-width);
      height: 100vh;
      background-color: var(--color-bg);
      border-right: 1px solid var(--color-code-border);
      overflow-y: auto;
      padding: var(--space-xl);
    }

    .toc-sidebar h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: var(--space-lg);
      color: var(--color-text);
    }

    .toc-list {
      list-style: none;
    }

    .toc-list li {
      margin-bottom: var(--space-sm);
    }

    .toc-list a {
      color: var(--color-text-muted);
      text-decoration: none;
      display: block;
      padding: var(--space-xs) var(--space-sm);
      border-radius: 4px;
      transition: all 0.2s ease;
      font-size: 0.875rem;
    }

    .toc-list a:hover {
      color: var(--color-accent);
      background-color: var(--color-code-bg);
    }

    .toc-list a.active {
      color: var(--color-accent);
      font-weight: 600;
      background-color: var(--color-code-bg);
    }

    /* Main Content */
    .main-content {
      margin-left: var(--sidebar-width);
      width: calc(100% - var(--sidebar-width));
      padding: var(--space-3xl) var(--space-2xl);
    }

    .chapter {
      max-width: var(--max-width);
      margin: 0 auto;
    }

    /* Typography Styles */
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: var(--space-xl);
      line-height: 1.2;
      color: var(--color-text);
    }

    h2 {
      font-size: 2rem;
      font-weight: 600;
      margin-top: var(--space-3xl);
      margin-bottom: var(--space-lg);
      line-height: 1.3;
      color: var(--color-text);
    }

    h3 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-top: var(--space-2xl);
      margin-bottom: var(--space-md);
      line-height: 1.4;
      color: var(--color-text);
    }

    h4 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: var(--space-xl);
      margin-bottom: var(--space-md);
      color: var(--color-text);
    }

    p {
      margin-bottom: var(--space-lg);
      color: var(--color-text);
    }

    strong {
      font-weight: 600;
      color: var(--color-text);
    }

    em {
      font-style: italic;
    }

    /* Links */
    a {
      color: var(--color-accent);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    a:hover {
      color: var(--color-accent-hover);
      text-decoration: underline;
    }

    /* Lists */
    ul, ol {
      margin-bottom: var(--space-lg);
      padding-left: var(--space-xl);
    }

    li {
      margin-bottom: var(--space-sm);
    }

    /* Blockquotes */
    blockquote {
      background-color: var(--color-blockquote-bg);
      border-left: 4px solid var(--color-blockquote-border);
      padding: var(--space-lg);
      margin: var(--space-lg) 0;
      font-style: italic;
      color: var(--color-text);
    }

    /* Code Styles */
    code {
      font-family: var(--font-mono);
      font-size: 0.875rem;
      background-color: var(--color-code-bg);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      color: var(--color-text);
    }

    pre {
      background-color: var(--color-code-bg);
      border: 1px solid var(--color-code-border);
      border-radius: 8px;
      padding: var(--space-lg);
      margin: var(--space-lg) 0;
      overflow-x: auto;
      font-size: 0.875rem;
      line-height: 1.6;
    }

    pre code {
      background-color: transparent;
      padding: 0;
      font-size: inherit;
      color: inherit;
    }

    /* Syntax Highlighting (GitHub Dark Theme) */
    .hljs {
      color: #e6edf3;
      background: transparent;
    }

    .hljs-comment,
    .hljs-quote {
      color: #8b949e;
    }

    .hljs-keyword,
    .hljs-selector-tag,
    .hljs-addition {
      color: #ff7b72;
    }

    .hljs-string,
    .hljs-meta .hljs-string {
      color: #a5d6ff;
    }

    .hljs-attribute,
    .hljs-template-tag,
    .hljs-template-variable,
    .hljs-type,
    .hljs-section {
      color: #79c0ff;
    }

    .hljs-title,
    .hljs-name {
      color: #d2a8ff;
    }

    .hljs-literal,
    .hljs-number {
      color: #79c0ff;
    }

    .hljs-variable,
    .hljs-params {
      color: #ffa657;
    }

    .hljs-built_in {
      color: #ffa657;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: var(--space-lg) 0;
      font-size: 0.875rem;
    }

    th, td {
      padding: var(--space-sm) var(--space-md);
      text-align: left;
      border: 1px solid var(--color-code-border);
    }

    th {
      background-color: var(--color-code-bg);
      font-weight: 600;
    }

    /* Horizontal Rule */
    hr {
      border: none;
      height: 1px;
      background-color: var(--color-code-border);
      margin: var(--space-2xl) 0;
    }

    /* Print Styles */
    @media print {
      .toc-sidebar {
        display: none;
      }

      .main-content {
        margin-left: 0;
        width: 100%;
        padding: 0;
      }

      .chapter {
        max-width: 100%;
      }

      pre {
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      h1, h2, h3 {
        page-break-after: avoid;
      }

      pre, blockquote {
        page-break-inside: avoid;
      }
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .toc-sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }

      .toc-sidebar.open {
        transform: translateX(0);
      }

      .main-content {
        margin-left: 0;
        width: 100%;
        padding: var(--space-xl) var(--space-lg);
      }

      h1 {
        font-size: 2rem;
      }

      h2 {
        font-size: 1.5rem;
      }

      h3 {
        font-size: 1.25rem;
      }
    }

    /* Title Page */
    .title-page {
      text-align: center;
      padding: var(--space-3xl) 0;
      margin-bottom: var(--space-3xl);
    }

    .title-page h1 {
      font-size: 3rem;
      margin-bottom: var(--space-md);
    }

    .title-page .subtitle {
      font-size: 1.5rem;
      color: var(--color-text-muted);
      margin-bottom: var(--space-xl);
    }

    .title-page .author {
      font-size: 1.125rem;
      color: var(--color-text-muted);
    }

    /* Chapter Navigation */
    .chapter-nav {
      display: flex;
      justify-content: space-between;
      margin-top: var(--space-3xl);
      padding-top: var(--space-2xl);
      border-top: 1px solid var(--color-code-border);
    }

    .chapter-nav a {
      display: inline-flex;
      align-items: center;
      padding: var(--space-sm) var(--space-md);
      background-color: var(--color-code-bg);
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .chapter-nav a:hover {
      background-color: var(--color-accent);
      color: white;
      text-decoration: none;
    }
  `;
}

// Generate the HTML template
function generateHTMLTemplate(content, title = BOOK_TITLE) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
    <style>${generateCSS()}</style>
</head>
<body>
    <div class="book-container">
        <nav class="toc-sidebar">
            <h2>Table of Contents</h2>
            <ul class="toc-list" id="toc-list"></ul>
        </nav>
        <main class="main-content">
            <div class="chapter">
                ${content}
            </div>
        </main>
    </div>
    <script>
        // Generate table of contents from h1 and h2 elements
        function generateTOC() {
            const tocList = document.getElementById('toc-list');
            const headings = document.querySelectorAll('.chapter h1, .chapter h2');
            
            headings.forEach((heading, index) => {
                const id = 'heading-' + index;
                heading.id = id;
                
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#' + id;
                a.textContent = heading.textContent;
                
                if (heading.tagName === 'H2') {
                    a.style.paddingLeft = 'var(--space-xl)';
                    a.style.fontSize = '0.8125rem';
                }
                
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    heading.scrollIntoView({ behavior: 'smooth' });
                    
                    // Update active state
                    document.querySelectorAll('.toc-list a').forEach(link => {
                        link.classList.remove('active');
                    });
                    a.classList.add('active');
                });
                
                li.appendChild(a);
                tocList.appendChild(li);
            });
        }
        
        // Initialize TOC when page loads
        document.addEventListener('DOMContentLoaded', generateTOC);
        
        // Update active TOC item on scroll
        window.addEventListener('scroll', () => {
            const headings = document.querySelectorAll('.chapter h1, .chapter h2');
            const tocLinks = document.querySelectorAll('.toc-list a');
            
            let current = '';
            headings.forEach(heading => {
                const rect = heading.getBoundingClientRect();
                if (rect.top <= 100) {
                    current = heading.id;
                }
            });
            
            tocLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        });
    </script>
</body>
</html>`;
}

// Process markdown files
async function processMarkdownFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const htmlContent = marked.parse(content);
    return htmlContent;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return '';
  }
}

// Build the complete book
async function buildBook() {
  console.log('🚀 Building HTML book...');
  
  const chaptersDir = path.join(__dirname, '..', 'chapters');
  const outputDir = path.join(__dirname, '..', 'dist');
  
  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });
  
  // Generate title page
  const titlePageContent = `
    <div class="title-page">
      <h1>${BOOK_TITLE}</h1>
      <p class="subtitle">${BOOK_SUBTITLE}</p>
      <p class="author">By ${AUTHOR}</p>
    </div>
  `;
  
  // Process all chapters
  let fullContent = titlePageContent;
  
  for (const chapterFile of CHAPTER_ORDER) {
    const chapterPath = path.join(chaptersDir, chapterFile);
    
    try {
      await fs.access(chapterPath);
      console.log(`Processing ${chapterFile}...`);
      const chapterContent = await processMarkdownFile(chapterPath);
      fullContent += `<div class="chapter-section">${chapterContent}</div><hr>`;
    } catch (error) {
      console.warn(`Chapter ${chapterFile} not found, skipping...`);
    }
  }
  
  // Process examples and appendix
  const examplesDir = path.join(__dirname, '..', 'examples');
  const appendixDir = path.join(__dirname, '..', 'appendix');
  
  // Add examples section
  fullContent += '<h1>Examples</h1>';
  try {
    const exampleFiles = await fs.readdir(examplesDir);
    for (const file of exampleFiles) {
      if (file.endsWith('.md')) {
        const examplePath = path.join(examplesDir, file);
        console.log(`Processing example ${file}...`);
        const exampleContent = await processMarkdownFile(examplePath);
        fullContent += `<div class="chapter-section">${exampleContent}</div><hr>`;
      }
    }
  } catch (error) {
    console.warn('Examples directory not found');
  }
  
  // Add appendix section
  fullContent += '<h1>Appendix</h1>';
  try {
    const appendixFiles = await fs.readdir(appendixDir);
    for (const file of appendixFiles) {
      if (file.endsWith('.md')) {
        const appendixPath = path.join(appendixDir, file);
        console.log(`Processing appendix ${file}...`);
        const appendixContent = await processMarkdownFile(appendixPath);
        fullContent += `<div class="chapter-section">${appendixContent}</div><hr>`;
      }
    }
  } catch (error) {
    console.warn('Appendix directory not found');
  }
  
  // Generate final HTML
  const finalHTML = generateHTMLTemplate(fullContent);
  
  // Write output file
  const outputPath = path.join(outputDir, 'clide-handbook.html');
  await fs.writeFile(outputPath, finalHTML);
  
  // Copy CSS file separately for better caching
  const cssPath = path.join(outputDir, 'clide-handbook.css');
  await fs.writeFile(cssPath, generateCSS());
  
  console.log(`✅ Book built successfully!`);
  console.log(`📖 Output: ${outputPath}`);
  console.log(`🎨 CSS: ${cssPath}`);
}

// Run the build
if (require.main === module) {
  buildBook().catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
}

module.exports = { buildBook, generateHTMLTemplate, generateCSS };
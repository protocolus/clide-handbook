#!/bin/bash

# Simple HTML book builder without npm dependencies
# Uses pandoc if available, otherwise basic conversion

OUTPUT_DIR="dist"
OUTPUT_FILE="$OUTPUT_DIR/clide-handbook-simple.html"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# CSS content
cat > "$OUTPUT_DIR/book-style.css" << 'EOF'
/* Technical Book CSS */
:root {
  --max-width: 900px;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Consolas', 'Monaco', 'Courier New', monospace;
}

body {
  font-family: var(--font-sans);
  line-height: 1.7;
  color: #333;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 2rem;
  background: #fff;
}

h1 { font-size: 2.5rem; margin: 2rem 0 1rem 0; color: #1a1a1a; }
h2 { font-size: 2rem; margin: 2rem 0 1rem 0; color: #2a2a2a; }
h3 { font-size: 1.5rem; margin: 1.5rem 0 0.75rem 0; color: #3a3a3a; }

code {
  font-family: var(--font-mono);
  background: #f6f8fa;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.875rem;
}

pre {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  line-height: 1.45;
}

pre code {
  background: none;
  padding: 0;
  font-size: 0.875rem;
}

blockquote {
  border-left: 4px solid #0066cc;
  margin: 1rem 0;
  padding-left: 1rem;
  color: #666;
}

a { color: #0066cc; text-decoration: none; }
a:hover { text-decoration: underline; }

table {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

th, td {
  border: 1px solid #e1e4e8;
  padding: 0.5rem;
  text-align: left;
}

th { background: #f6f8fa; font-weight: 600; }

.title-page {
  text-align: center;
  padding: 4rem 0;
  border-bottom: 1px solid #e1e4e8;
  margin-bottom: 3rem;
}

.chapter { page-break-before: always; }

@media print {
  body { margin: 0; padding: 0; }
  .chapter { page-break-before: always; }
  pre { white-space: pre-wrap; }
}
EOF

# Start HTML file
cat > "$OUTPUT_FILE" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Clide Handbook - Autonomous Development with Claude Code</title>
    <link rel="stylesheet" href="book-style.css">
    <style>
        /* Inline critical CSS for immediate rendering */
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; }
        pre { background: #f6f8fa; padding: 1rem; overflow-x: auto; }
        code { background: #f6f8fa; padding: 0.125rem 0.375rem; font-family: monospace; }
    </style>
</head>
<body>
    <div class="title-page">
        <h1>The Clide Handbook</h1>
        <h2>Autonomous Development with Claude Code</h2>
        <p>By Claude Code Community</p>
    </div>
EOF

# Function to convert markdown to basic HTML
convert_markdown() {
    local file=$1
    
    # Check if pandoc is available
    if command -v pandoc &> /dev/null; then
        pandoc "$file" -t html
    else
        # Basic conversion using sed
        cat "$file" | \
        sed 's/^# \(.*\)/<h1>\1<\/h1>/' | \
        sed 's/^## \(.*\)/<h2>\1<\/h2>/' | \
        sed 's/^### \(.*\)/<h3>\1<\/h3>/' | \
        sed 's/^```\(.*\)/<pre><code class="\1">/' | \
        sed 's/^```/<\/code><\/pre>/' | \
        sed 's/`\([^`]*\)`/<code>\1<\/code>/g' | \
        sed 's/^\* /<li>/g' | \
        sed 's/^[0-9]\+\. /<li>/g' | \
        sed 's/^\s*$/\n<p>/' | \
        sed 's/^> \(.*\)/<blockquote>\1<\/blockquote>/' | \
        sed 's/\*\*\([^*]*\)\*\*/<strong>\1<\/strong>/g' | \
        sed 's/\*\([^*]*\)\*/<em>\1<\/em>/g' | \
        awk 'BEGIN{p=1} /^<li>/{if(p){print "<ul>"; p=0}} !/^<li>/{if(!p){print "</ul>"; p=1}} {print}'
    fi
}

# Process chapters
echo "Processing chapters..."
for file in chapters/*.md; do
    if [ -f "$file" ]; then
        echo "  - $(basename "$file")"
        echo "<div class='chapter'>" >> "$OUTPUT_FILE"
        convert_markdown "$file" >> "$OUTPUT_FILE"
        echo "</div><hr>" >> "$OUTPUT_FILE"
    fi
done

# Process examples
if [ -d "examples" ]; then
    echo "Processing examples..."
    echo "<h1>Examples</h1>" >> "$OUTPUT_FILE"
    for file in examples/*.md; do
        if [ -f "$file" ]; then
            echo "  - $(basename "$file")"
            echo "<div class='chapter'>" >> "$OUTPUT_FILE"
            convert_markdown "$file" >> "$OUTPUT_FILE"
            echo "</div><hr>" >> "$OUTPUT_FILE"
        fi
    done
fi

# Process appendix
if [ -d "appendix" ]; then
    echo "Processing appendix..."
    echo "<h1>Appendix</h1>" >> "$OUTPUT_FILE"
    for file in appendix/*.md; do
        if [ -f "$file" ]; then
            echo "  - $(basename "$file")"
            echo "<div class='chapter'>" >> "$OUTPUT_FILE"
            convert_markdown "$file" >> "$OUTPUT_FILE"
            echo "</div><hr>" >> "$OUTPUT_FILE"
        fi
    done
fi

# Close HTML
cat >> "$OUTPUT_FILE" << 'EOF'
</body>
</html>
EOF

echo "✅ HTML book generated successfully!"
echo "📖 Output: $OUTPUT_FILE"
echo "🎨 CSS: $OUTPUT_DIR/book-style.css"
echo ""
echo "To view the book, open: $OUTPUT_FILE"
// rename-prefix.js – bulk replace class name prefix "myntra-" with "shop-"
// Run with: `node scripts/rename-prefix.js`
const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'frontend', 'src');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip node_modules and public
      if (['node_modules', 'public', '.git'].includes(entry.name)) continue;
      walk(full);
    } else if (entry.isFile()) {
      if (full.endsWith('.js') || full.endsWith('.jsx') || full.endsWith('.css')) {
        let content = fs.readFileSync(full, 'utf8');
        const newContent = content.replace(/\bmyntra-/g, 'shop-');
        if (newContent !== content) {
          fs.writeFileSync(full, newContent, 'utf8');
          console.log(`Renamed in ${path.relative(srcDir, full)}`);
        }
      }
    }
  }
}

walk(srcDir);
console.log('✅ All class prefixes updated.');


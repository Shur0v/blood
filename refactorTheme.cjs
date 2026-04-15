const fs = require('fs');
const path = require('path');

const DIRECTORIES = ['src/app', 'src/components'];

// Walk directories
function walk(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
        let filepath = path.join(dir, file);
        let stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walk(filepath, callback);
        } else if (filepath.endsWith('.tsx') || filepath.endsWith('.ts') || filepath.endsWith('.js')) {
            callback(filepath);
        }
    });
}

const replacements = [
    // Colors
    { regex: /accent-red/g, replacement: 'primary' },
    { regex: /blood-red/g, replacement: 'primary-dark' },
    { regex: /soft-crimson/g, replacement: 'primary' }, // Fallback
    
    // Hardcoded Text/Bgs
    { regex: /bg-\[\#101828\]/g, replacement: 'bg-text' },
    { regex: /text-\[\#101828\]/g, replacement: 'text-text' },
    { regex: /text-\[\#1A1A1A\]/g, replacement: 'text-text' },
    { regex: /border-\[\#101828\]/g, replacement: 'border-border' },
    { regex: /ring-\[\#101828\]/g, replacement: 'ring-border' },

    // The explicit /opacity ones needed translation (like bg-[#101828]/5) Let's just fix the color part and let tailwind handle opacity
    { regex: /\[\#101828\]/g, replacement: 'text' },
    { regex: /\[\#1A1A1A\]/g, replacement: 'text' },
    { regex: /\[\#C1121F\]/g, replacement: 'primary-dark' },
    { regex: /\[\#E63946\]/g, replacement: 'primary' },
    { regex: /\[\#FF3131\]/g, replacement: 'primary' },
    { regex: /\[\#F8F9FA\]/g, replacement: 'bg' },
    
    // Shadows
    { regex: /shadow-\[.*?rgba.*?\]/g, replacement: 'shadow-card' },
    { regex: /hover:shadow-\[.*?rgba.*?\]/g, replacement: 'hover:shadow-hover' },
    
    // Background/Blurs
    { regex: /bg-white\/40/g, replacement: 'bg-glass' },
    { regex: /bg-white\/30/g, replacement: 'bg-glass' },
    
    // Gradients standardizer (e.g. bg-gradient-to-br from-[#101828] to-[#1c2a44])
    { regex: /from-text to-\[\#1c2a44\]/g, replacement: 'from-text to-text/80' }
];

let filesProcessed = 0;
let filesChanged = 0;

DIRECTORIES.forEach(dir => {
    walk(dir, filepath => {
        let content = fs.readFileSync(filepath, 'utf8');
        let newContent = content;

        replacements.forEach(({ regex, replacement }) => {
            newContent = newContent.replace(regex, replacement);
        });

        // Special Glass class enforcement
        // Convert static glass pseudo-classes to theme generic
        newContent = newContent.replace(/backdrop-blur-\[\d+px\]/g, 'backdrop-blur-glass');

        if (content !== newContent) {
            fs.writeFileSync(filepath, newContent, 'utf8');
            filesChanged++;
            console.log(`Updated ${filepath}`);
        }
        filesProcessed++;
    });
});

console.log(`Processed ${filesProcessed} files, changed ${filesChanged} files.`);

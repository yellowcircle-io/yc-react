const fs = require('fs');

const filePath = './src/pages/OwnYourStoryArticle1Page.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the desktop section padding pattern
// Replace the problematic pattern with proper centering
const oldPattern = /padding: '0 60px',\s*maxWidth: '900px',\s*margin: '0 auto'/g;
const newPattern = "padding: '0 max(80px, calc((100vw - 1000px) / 2))'";

content = content.replace(oldPattern, newPattern);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed desktop section padding!');

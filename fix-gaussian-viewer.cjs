/**
 * Script untuk fix gaussian-viewer-simple.html
 * Menambahkan fungsi onFileChange yang hilang
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing gaussian-viewer-simple.html...\n');

const viewerPath = 'public/gaussian-viewer-simple.html';

if (!fs.existsSync(viewerPath)) {
  console.error('❌ File not found:', viewerPath);
  process.exit(1);
}

// Read file
let content = fs.readFileSync(viewerPath, 'utf8');

// Check if onFileChange already exists
if (content.includes('window.onFileChange')) {
  console.log('✅ onFileChange function already exists!');
} else {
  console.log('➕ Adding onFileChange function...');

  // Find the last </script> tag and add function before it
  const onFileChangeFunction = `
  // Function to handle file selection
  window.onFileChange = function(input, labelId) {
    const label = document.getElementById(labelId);
    if (input.files && input.files[0]) {
      label.textContent = input.files[0].name;
      console.log('File selected:', input.files[0].name);
    }
  };
`;

  // Insert before closing </script> tag in the main script section
  const scriptEndIndex = content.lastIndexOf('</script>');
  if (scriptEndIndex !== -1) {
    content = content.slice(0, scriptEndIndex) + onFileChangeFunction + '\n' + content.slice(scriptEndIndex);
    fs.writeFileSync(viewerPath, content, 'utf8');
    console.log('✅ Added onFileChange function successfully!');
  } else {
    console.error('❌ Could not find </script> tag');
    process.exit(1);
  }
}

// Also check and fix file input accept attribute
console.log('\n🔍 Checking file input accept attribute...');

if (content.includes('accept="image/*"') && !content.includes('accept=".ply,.splat,.ksplat"')) {
  console.log('⚠️  Found image/* accept, fixing to support .ply files...');
  content = content.replace(/accept="image\/\*"/g, 'accept=".ply,.splat,.ksplat,image/*"');
  fs.writeFileSync(viewerPath, content, 'utf8');
  console.log('✅ Fixed file input to accept .ply, .splat, .ksplat files!');
} else if (content.includes('accept=".ply,.splat,.ksplat"')) {
  console.log('✅ File input already accepts .ply files!');
} else {
  console.log('ℹ️  File input accept attribute not found or already correct');
}

console.log('\n✨ Gaussian viewer fix complete!\n');

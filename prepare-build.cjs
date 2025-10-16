/**
 * Script untuk prepare semua file sebelum build production
 * Jalankan dengan: node prepare-build.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing files for production build...\n');

// Helper function to copy file
function copyFile(src, dest) {
  try {
    // Create directory if not exists
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(src, dest);
    console.log(`✅ Copied: ${src} → ${dest}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to copy ${src}:`, error.message);
    return false;
  }
}

// Helper function to copy directory recursively
function copyDirectory(src, dest) {
  try {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);

      if (fs.statSync(srcPath).isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
    console.log(`✅ Copied directory: ${src} → ${dest}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to copy directory ${src}:`, error.message);
    return false;
  }
}

// 1. Copy logo to public (akan masuk ke dist saat build)
console.log('📁 Step 1: Copying logo...');
const logoSrc = 'src/assets/cureva_logo.jpg';
const logoDest = 'public/cureva_logo.jpg';
if (fs.existsSync(logoSrc)) {
  copyFile(logoSrc, logoDest);
} else {
  console.warn('⚠️  Logo not found at:', logoSrc);
}

// 2. Copy vite.svg if exists
console.log('\n📁 Step 2: Copying vite.svg...');
const viteSvg = 'public/vite.svg';
if (fs.existsSync(viteSvg)) {
  console.log('✅ vite.svg already in public folder');
} else {
  console.log('ℹ️  vite.svg not found (optional)');
}

// 3. Copy Three.js library
console.log('\n📁 Step 3: Copying Three.js library...');
const threeSrc = 'node_modules/three/build/three.module.js';
const threeDest = 'public/libs/three.module.js';
if (fs.existsSync(threeSrc)) {
  copyFile(threeSrc, threeDest);
} else {
  console.warn('⚠️  Three.js not found. Run: npm install');
}

// 4. Copy Gaussian Splats library
console.log('\n📁 Step 4: Copying Gaussian Splats library...');
const gaussianSrc = 'node_modules/@mkkellogg/gaussian-splats-3d/build/gaussian-splats-3d.module.js';
const gaussianDest = 'public/libs/gaussian-splats-3d.module.js';
if (fs.existsSync(gaussianSrc)) {
  copyFile(gaussianSrc, gaussianDest);
} else {
  console.warn('⚠️  Gaussian Splats not found. Run: npm install');
}

// 5. Create _redirects for SPA routing (untuk Netlify)
console.log('\n📁 Step 5: Creating _redirects file...');
const redirectsContent = '/*    /index.html   200';
fs.writeFileSync('public/_redirects', redirectsContent);
console.log('✅ Created _redirects for SPA routing');

// 6. Create .htaccess for Apache (untuk shared hosting)
console.log('\n📁 Step 6: Creating .htaccess file...');
const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Enable CORS for assets
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Cross-Origin-Embedder-Policy "require-corp"
  Header set Cross-Origin-Opener-Policy "same-origin"
</IfModule>

# Enable gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/wasm "access plus 1 year"
</IfModule>
`;
fs.writeFileSync('public/.htaccess', htaccessContent);
console.log('✅ Created .htaccess for Apache server');

// 7. Copy sample files if exist
console.log('\n📁 Step 7: Checking sample files...');
const sampleDir = 'public/sample';
if (fs.existsSync(sampleDir)) {
  console.log('✅ Sample files already in public/sample');
} else {
  console.log('ℹ️  No sample directory (optional)');
}

// 8. Create robots.txt
console.log('\n📁 Step 8: Creating robots.txt...');
const robotsContent = `User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
`;
fs.writeFileSync('public/robots.txt', robotsContent);
console.log('✅ Created robots.txt');

// Summary
console.log('\n' + '='.repeat(50));
console.log('✨ Preparation complete!\n');
console.log('📋 Files prepared:');
console.log('   - Logo copied to public/');
console.log('   - Three.js library copied');
console.log('   - Gaussian Splats library copied');
console.log('   - .htaccess created for Apache');
console.log('   - _redirects created for Netlify');
console.log('   - robots.txt created');
console.log('\n🚀 Now run: npm run build');
console.log('📦 Then upload contents of dist/ folder to hosting');
console.log('='.repeat(50) + '\n');

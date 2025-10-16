#!/bin/bash

echo "========================================"
echo "CUREVA - Build for Hosting Script"
echo "========================================"
echo ""

echo "[1/5] Preparing files..."
node prepare-build.js
if [ $? -ne 0 ]; then
    echo "Error preparing files!"
    exit 1
fi
echo ""

echo "[2/5] Fixing Gaussian Viewer..."
node fix-gaussian-viewer.js
if [ $? -ne 0 ]; then
    echo "Error fixing viewer!"
    exit 1
fi
echo ""

echo "[3/5] Cleaning old dist folder..."
rm -rf dist
echo "Done!"
echo ""

echo "[4/5] Building production..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi
echo ""

echo "[5/5] Post-build cleanup..."
# Copy .htaccess to dist if not already there
[ ! -f dist/.htaccess ] && cp public/.htaccess dist/.htaccess
[ ! -f dist/robots.txt ] && cp public/robots.txt dist/robots.txt
echo "Done!"
echo ""

echo "========================================"
echo "BUILD SUCCESS!"
echo "========================================"
echo ""
echo "Your production files are ready in: dist/"
echo ""
echo "Next steps:"
echo "1. Go to cPanel File Manager"
echo "2. Navigate to public_html folder"
echo "3. Delete all old files (backup first!)"
echo "4. Upload ALL files from dist/ folder"
echo "5. Make sure folder structure is:"
echo "   public_html/"
echo "   ├── index.html"
echo "   ├── .htaccess"
echo "   ├── assets/"
echo "   ├── libs/"
echo "   ├── gaussian-splats-demo/"
echo "   └── sample/"
echo ""
echo "========================================"

@echo off
echo ========================================
echo CUREVA - Build for Hosting Script
echo ========================================
echo.

echo [1/5] Preparing files...
node prepare-build.js
if %ERRORLEVEL% NEQ 0 (
    echo Error preparing files!
    pause
    exit /b 1
)
echo.

echo [2/5] Fixing Gaussian Viewer...
node fix-gaussian-viewer.js
if %ERRORLEVEL% NEQ 0 (
    echo Error fixing viewer!
    pause
    exit /b 1
)
echo.

echo [3/5] Cleaning old dist folder...
if exist dist rmdir /s /q dist
echo Done!
echo.

echo [4/5] Building production...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)
echo.

echo [5/5] Post-build cleanup...
rem Copy .htaccess to dist if not already there
if not exist dist\.htaccess copy public\.htaccess dist\.htaccess
if not exist dist\robots.txt copy public\robots.txt dist\robots.txt
echo Done!
echo.

echo ========================================
echo BUILD SUCCESS!
echo ========================================
echo.
echo Your production files are ready in: dist/
echo.
echo Next steps:
echo 1. Go to cPanel File Manager
echo 2. Navigate to public_html folder
echo 3. Delete all old files (backup first!)
echo 4. Upload ALL files from dist/ folder
echo 5. Make sure folder structure is:
echo    public_html/
echo    ├── index.html
echo    ├── .htaccess
echo    ├── assets/
echo    ├── libs/
echo    ├── gaussian-splats-demo/
echo    └── sample/
echo.
echo ========================================
pause

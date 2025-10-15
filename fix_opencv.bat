@echo off
echo Fixing OpenCV installation...
echo.

echo Uninstalling current opencv-python...
pip uninstall -y opencv-python opencv-python-headless opencv-contrib-python

echo.
echo Installing opencv-contrib-python (with full GUI support)...
pip install opencv-contrib-python

echo.
echo Done! Please try running the SAM GUI again.
pause

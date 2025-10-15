#!/usr/bin/env python3
"""
Test all dependencies for Tello controller
"""

print("Testing Python dependencies...")
print("=" * 40)

# Test basic imports
try:
    import sys
    print(f"OK: Python version {sys.version}")
except Exception as e:
    print(f"ERROR: Python basic import: {e}")

try:
    import tkinter as tk
    print("OK: tkinter imported")

    # Test basic tkinter window
    root = tk.Tk()
    root.withdraw()  # Hide window
    root.destroy()
    print("OK: tkinter GUI test passed")
except Exception as e:
    print(f"ERROR: tkinter failed: {e}")

try:
    import threading
    print("OK: threading imported")
except Exception as e:
    print(f"ERROR: threading failed: {e}")

try:
    import time
    print("OK: time imported")
except Exception as e:
    print(f"ERROR: time failed: {e}")

try:
    import cv2
    print(f"OK: OpenCV version {cv2.__version__}")
except Exception as e:
    print(f"ERROR: OpenCV failed: {e}")

try:
    from PIL import Image, ImageTk
    print(f"OK: PIL version {Image.__version__}")
except Exception as e:
    print(f"ERROR: PIL failed: {e}")

try:
    import numpy as np
    print(f"OK: NumPy version {np.__version__}")
except Exception as e:
    print(f"ERROR: NumPy failed: {e}")

try:
    from djitellopy import Tello
    print("OK: djitellopy imported successfully")

    # Test Tello object creation (without connecting)
    tello = Tello()
    print("OK: Tello object created")
except Exception as e:
    print(f"ERROR: djitellopy failed: {e}")

print("=" * 40)
print("Dependency test completed!")
print("\nIf all tests show 'OK', your environment is ready.")
print("If you see errors, install missing packages with:")
print("pip install opencv-python pillow numpy djitellopy")
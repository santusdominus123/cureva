#!/usr/bin/env python3
"""
Setup script for DJI Tello ROS2 Controller
Checks and installs required dependencies
"""

import sys
import subprocess
import importlib
import json
import os

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        return False, f"Python {version.major}.{version.minor} detected. Python 3.7+ is required."
    return True, f"Python {version.major}.{version.minor}.{version.micro} - OK"

def check_package_installed(package_name):
    """Check if a Python package is installed"""
    try:
        importlib.import_module(package_name.replace('-', '_'))
        return True
    except ImportError:
        return False

def install_package(package_name):
    """Install a Python package using pip"""
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', package_name])
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    """Main setup function"""
    print("DJI Tello ROS2 Controller Setup")
    print("=" * 50)
    
    # Check Python version
    python_ok, python_msg = check_python_version()
    print(f"Python: {python_msg}")
    
    if not python_ok:
        print("ERROR: Please install Python 3.7 or newer")
        return False
    
    # Required packages
    required_packages = [
        ('djitellopy', 'djitellopy'),
        ('opencv-python', 'cv2'),
        ('Pillow', 'PIL'),
        ('numpy', 'numpy')
    ]
    
    print("\nChecking required packages...")
    
    missing_packages = []
    for pip_name, import_name in required_packages:
        if check_package_installed(import_name):
            print(f"OK: {pip_name} - installed")
        else:
            print(f"MISSING: {pip_name} - missing")
            missing_packages.append(pip_name)
    
    # Install missing packages
    if missing_packages:
        print(f"\nInstalling {len(missing_packages)} missing packages...")
        
        for package in missing_packages:
            print(f"Installing {package}...")
            if install_package(package):
                print(f"SUCCESS: {package} installed successfully")
            else:
                print(f"ERROR: Failed to install {package}")
                return False
    
    # Final verification
    print("\nFinal verification...")
    all_installed = True
    for pip_name, import_name in required_packages:
        if check_package_installed(import_name):
            print(f"OK: {pip_name}")
        else:
            print(f"ERROR: {pip_name}")
            all_installed = False
    
    if all_installed:
        print("\nSetup completed successfully!")
        print("You can now run the drone controller:")
        print("python drone_controller_gui.py")
        return True
    else:
        print("\nSetup failed. Some packages are still missing.")
        return False

def check_drone_connectivity():
    """Check if we can connect to a DJI Tello drone"""
    try:
        from djitellopy import Tello
        
        print("\nTesting drone connectivity...")
        tello = Tello()
        
        # Try to connect with timeout
        tello.connect()
        battery = tello.get_battery()
        
        print(f"SUCCESS: Drone connected! Battery: {battery}%")
        tello.end()
        return True, battery
        
    except Exception as e:
        print(f"WARNING: Drone connection test failed: {e}")
        print("Make sure your DJI Tello is:")
        print("- Powered on")
        print("- In WiFi mode")
        print("- Connected to this computer")
        return False, 0

if __name__ == "__main__":
    try:
        success = main()
        
        if success:
            # Optional: test drone connectivity
            response = input("\nTest drone connectivity? (y/n): ").lower()
            if response == 'y':
                check_drone_connectivity()
        
        print("\n" + "=" * 50)
        print("Setup script completed.")
        
    except KeyboardInterrupt:
        print("\nSETUP INTERRUPTED by user")
    except Exception as e:
        print(f"\nSETUP FAILED with error: {e}")
        sys.exit(1)
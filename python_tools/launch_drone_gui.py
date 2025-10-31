#!/usr/bin/env python3
"""
Launcher script for DJI Tello ROS2 Drone Controller GUI
This script is called from the React application
"""

import sys
import os
import subprocess
import json

def main():
    """Main launcher function"""
    try:
        # Get the directory of this script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        gui_script = os.path.join(script_dir, 'drone_controller_gui.py')
        
        # Check if GUI script exists
        if not os.path.exists(gui_script):
            print(json.dumps({
                "status": "error",
                "message": f"GUI script not found: {gui_script}"
            }))
            return 1
        
        # Launch the GUI
        print(json.dumps({
            "status": "launching",
            "message": "Starting DJI Tello Controller GUI..."
        }))
        
        # Start the GUI process
        if sys.platform.startswith('win'):
            # Windows
            subprocess.Popen([sys.executable, gui_script], 
                           creationflags=subprocess.CREATE_NEW_CONSOLE)
        else:
            # Linux/Mac
            subprocess.Popen([sys.executable, gui_script])
        
        print(json.dumps({
            "status": "success",
            "message": "DJI Tello Controller GUI launched successfully"
        }))
        return 0
        
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": f"Failed to launch GUI: {str(e)}"
        }))
        return 1

if __name__ == "__main__":
    sys.exit(main())
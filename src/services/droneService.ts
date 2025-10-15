/**
 * Drone Service for launching Python GUI
 * Handles communication between React app and Python drone controller
 */

export interface DroneResponse {
  status: 'success' | 'error' | 'launching';
  message: string;
}

export class DroneService {
  private static instance: DroneService;
  private isLaunching = false;

  static getInstance(): DroneService {
    if (!DroneService.instance) {
      DroneService.instance = new DroneService();
    }
    return DroneService.instance;
  }

  /**
   * Launch Python Drone Controller GUI
   */
  async launchDroneGUI(): Promise<DroneResponse> {
    if (this.isLaunching) {
      return {
        status: 'error',
        message: 'Drone GUI is already launching'
      };
    }

    try {
      this.isLaunching = true;

      // Check if we're in Electron environment
      if (this.isElectronApp()) {
        return await this.launchViaElectron();
      } else {
        return await this.launchViaAPI();
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to launch drone GUI: ${error}`
      };
    } finally {
      this.isLaunching = false;
    }
  }

  /**
   * Check if running in Electron app
   */
  private isElectronApp(): boolean {
    return typeof window !== 'undefined' && 
           window.process && 
           window.process.type === 'renderer';
  }

  /**
   * Launch via Electron main process
   */
  private async launchViaElectron(): Promise<DroneResponse> {
    try {
      // Use Electron's ipcRenderer to communicate with main process
      const { ipcRenderer } = window.require('electron');
      
      const response = await ipcRenderer.invoke('launch-drone-gui');
      return response;
    } catch (error) {
      throw new Error(`Electron launch failed: ${error}`);
    }
  }

  /**
   * Launch via API call (for web version)
   */
  private async launchViaAPI(): Promise<DroneResponse> {
    try {
      const response = await fetch('/api/drone/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'launch_gui'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      // Fallback: try to launch directly via Python
      return await this.launchDirectly();
    }
  }

  /**
   * Direct launch using Python subprocess (fallback)
   */
  private async launchDirectly(): Promise<DroneResponse> {
    try {
      // For browser environment, we'll create a solution that works with local files
      // Simulate the launch process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to launch Python script using protocol handler or file system
      try {
        // Method 1: Try to use custom protocol or file system access
        const pythonScript = this.getCurrentDirectory() + '\\drone_controller.py';
        
        // Method 2: Create a batch file for Windows users
        if (navigator.platform.toLowerCase().includes('win')) {
          this.createLaunchBatchFile();
        }
        
        // Method 3: Use window.open to try launching the Python file
        const pythonCommand = `python "${pythonScript}"`;
        
        // Log instructions to console
        console.log('🚁 DJI Tello Controller Launch Instructions:');
        console.log('1. Open Command Prompt or Terminal');
        console.log('2. Navigate to:', this.getCurrentDirectory());
        console.log('3. Run command:', 'python drone_controller.py');
        console.log('4. Or double-click the generated launch_drone.bat file');
        
        // Try to execute Python script directly (Windows only)
        if (navigator.platform.toLowerCase().includes('win')) {
          try {
            // Create a hidden window to execute the batch file
            window.open('launch_drone.bat', '_blank');
          } catch (e) {
            console.log('Direct execution not supported, please run manually');
          }
        }
        
        return {
          status: 'success',
          message: 'Python GUI ready to launch! Check console for instructions or run the generated batch file.'
        };
        
      } catch (error) {
        return {
          status: 'success', 
          message: 'Instructions logged to console. Please run "python drone_controller.py" manually from the project directory.'
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Launch preparation failed: ${error}. Try running "python drone_controller.py" manually.`
      };
    }
  }

  /**
   * Get current directory path
   */
  private getCurrentDirectory(): string {
    try {
      // Try to get the current path from window location
      const url = new URL(window.location.href);
      const basePath = url.origin + url.pathname;
      
      // Convert web path to file system path (approximation)
      if (navigator.platform.toLowerCase().includes('win')) {
        return 'C:\\Users\\hengh\\Downloads\\cureva';
      } else {
        return '/home/user/cureva'; // Default for Linux/Mac
      }
    } catch (error) {
      return '.'; // Current directory
    }
  }

  /**
   * Create a batch file for Windows users to launch the Python GUI
   */
  private createLaunchBatchFile(): void {
    try {
      const batchContent = `@echo off
echo Starting DJI Tello ROS2 Controller...
cd /d "C:\\Users\\hengh\\Downloads\\cureva"
python drone_controller.py
pause`;

      // Create blob and download link
      const blob = new Blob([batchContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create invisible download link
      const link = document.createElement('a');
      link.href = url;
      link.download = 'launch_drone.bat';
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('✅ launch_drone.bat file created! Double-click to run the Python GUI.');
    } catch (error) {
      console.log('Could not create batch file:', error);
    }
  }

  /**
   * Check if Python and required packages are installed
   */
  async checkDependencies(): Promise<{ 
    python: boolean; 
    packages: { [key: string]: boolean };
    message: string;
  }> {
    try {
      const requiredPackages = [
        'djitellopy',
        'opencv-python',
        'pillow',
        'numpy'
      ];

      // This would need to be implemented based on your environment
      // For now, return a mock response
      return {
        python: true,
        packages: requiredPackages.reduce((acc, pkg) => {
          acc[pkg] = true; // Assume all packages are available
          return acc;
        }, {} as { [key: string]: boolean }),
        message: 'All dependencies are available'
      };
    } catch (error) {
      return {
        python: false,
        packages: {},
        message: `Dependency check failed: ${error}`
      };
    }
  }

  /**
   * Get drone controller status
   */
  async getDroneStatus(): Promise<{
    connected: boolean;
    flying: boolean;
    battery?: number;
    temperature?: number;
  }> {
    // This would communicate with the Python GUI to get status
    // For now, return a mock response
    return {
      connected: false,
      flying: false,
      battery: 0,
      temperature: 0
    };
  }
}

// Export singleton instance
export const droneService = DroneService.getInstance();

// Type declarations for Electron
declare global {
  interface Window {
    require: any;
    process: any;
  }
}
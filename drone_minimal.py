#!/usr/bin/env python3
"""
Minimal DJI Tello Controller - Debug Version
"""

import sys
import tkinter as tk
from tkinter import messagebox
import threading
import time

# Test imports first
try:
    import cv2
    print("OK: OpenCV imported successfully")
except ImportError as e:
    print(f"ERROR: OpenCV import failed: {e}")
    cv2 = None

try:
    from PIL import Image, ImageTk
    print("OK: PIL imported successfully")
except ImportError as e:
    print(f"ERROR: PIL import failed: {e}")
    Image = ImageTk = None

try:
    from djitellopy import Tello
    print("OK: djitellopy imported successfully")
except ImportError as e:
    print(f"ERROR: djitellopy import failed: {e}")
    print("Installing djitellopy...")
    import subprocess
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'djitellopy'])
        from djitellopy import Tello
        print("OK: djitellopy installed and imported")
    except Exception as install_error:
        print(f"ERROR: Failed to install djitellopy: {install_error}")
        Tello = None

class MinimalTelloController:
    def __init__(self):
        print("Initializing Minimal Tello Controller...")

        # Create main window
        self.root = tk.Tk()
        self.root.title("🚁 Minimal Tello Controller")
        self.root.geometry("600x400")
        self.root.configure(bg='#2c3e50')

        # Drone variables
        self.tello = None
        self.connected = False
        self.flying = False

        # Setup UI
        self.setup_ui()

        print("OK: Controller initialized successfully")

    def setup_ui(self):
        """Setup simple UI"""
        # Title
        title = tk.Label(self.root, text="DJI Tello Controller",
                        font=('Arial', 18, 'bold'),
                        fg='white', bg='#2c3e50')
        title.pack(pady=20)

        # Status
        self.status_label = tk.Label(self.root, text="Status: Disconnected",
                                    font=('Arial', 12),
                                    fg='#e74c3c', bg='#2c3e50')
        self.status_label.pack(pady=10)

        # Connection button
        self.connect_btn = tk.Button(self.root, text="CONNECT",
                                   command=self.toggle_connection,
                                   font=('Arial', 14, 'bold'),
                                   bg='#27ae60', fg='white',
                                   padx=30, pady=10, cursor='hand2')
        self.connect_btn.pack(pady=15)

        # Flight controls
        flight_frame = tk.Frame(self.root, bg='#2c3e50')
        flight_frame.pack(pady=20)

        self.takeoff_btn = tk.Button(flight_frame, text="TAKEOFF",
                                   command=self.takeoff,
                                   font=('Arial', 12, 'bold'),
                                   bg='#3498db', fg='white',
                                   padx=20, pady=8, cursor='hand2')
        self.takeoff_btn.pack(side='left', padx=10)

        self.land_btn = tk.Button(flight_frame, text="LAND",
                                command=self.land,
                                font=('Arial', 12, 'bold'),
                                bg='#f39c12', fg='white',
                                padx=20, pady=8, cursor='hand2')
        self.land_btn.pack(side='left', padx=10)

        # Movement controls
        move_frame = tk.Frame(self.root, bg='#2c3e50')
        move_frame.pack(pady=20)

        # WASD buttons
        w_btn = tk.Button(move_frame, text="W (Forward)",
                         command=lambda: self.move_drone('forward'),
                         font=('Arial', 10, 'bold'),
                         bg='#9b59b6', fg='white', padx=15, pady=5)
        w_btn.grid(row=0, column=1, padx=5, pady=2)

        a_btn = tk.Button(move_frame, text="A (Left)",
                         command=lambda: self.move_drone('left'),
                         font=('Arial', 10, 'bold'),
                         bg='#9b59b6', fg='white', padx=15, pady=5)
        a_btn.grid(row=1, column=0, padx=5, pady=2)

        s_btn = tk.Button(move_frame, text="S (Back)",
                         command=lambda: self.move_drone('back'),
                         font=('Arial', 10, 'bold'),
                         bg='#9b59b6', fg='white', padx=15, pady=5)
        s_btn.grid(row=1, column=1, padx=5, pady=2)

        d_btn = tk.Button(move_frame, text="D (Right)",
                         command=lambda: self.move_drone('right'),
                         font=('Arial', 10, 'bold'),
                         bg='#9b59b6', fg='white', padx=15, pady=5)
        d_btn.grid(row=1, column=2, padx=5, pady=2)

        # Instructions
        instructions = tk.Label(self.root,
                              text="1. Connect to Tello WiFi network\n2. Click CONNECT\n3. Use TAKEOFF and movement buttons",
                              font=('Arial', 10),
                              fg='#bdc3c7', bg='#2c3e50',
                              justify='center')
        instructions.pack(pady=20)

    def toggle_connection(self):
        """Toggle drone connection"""
        if not self.connected:
            self.connect_drone()
        else:
            self.disconnect_drone()

    def connect_drone(self):
        """Connect to drone"""
        def connect_thread():
            try:
                print("Attempting to connect to Tello...")
                self.update_status("Connecting...", '#f39c12')

                if Tello is None:
                    raise Exception("djitellopy not available")

                self.tello = Tello()
                self.tello.connect()

                # Test connection
                battery = self.tello.get_battery()
                print(f"Connected! Battery: {battery}%")

                # Update UI in main thread
                self.root.after(0, self.on_connection_success, battery)

            except Exception as e:
                print(f"Connection failed: {e}")
                self.root.after(0, self.on_connection_error, str(e))

        # Start connection in background
        threading.Thread(target=connect_thread, daemon=True).start()

    def on_connection_success(self, battery):
        """Handle successful connection"""
        self.connected = True
        self.update_status(f"Connected! Battery: {battery}%", '#27ae60')
        self.connect_btn.config(text="DISCONNECT", bg='#e74c3c')
        messagebox.showinfo("Success", f"Connected to Tello!\nBattery: {battery}%")

    def on_connection_error(self, error):
        """Handle connection error"""
        self.update_status("Connection Failed", '#e74c3c')
        messagebox.showerror("Error", f"Failed to connect:\n{error}")

    def disconnect_drone(self):
        """Disconnect from drone"""
        try:
            if self.tello:
                self.tello.end()
            self.connected = False
            self.flying = False
            self.update_status("Disconnected", '#e74c3c')
            self.connect_btn.config(text="CONNECT", bg='#27ae60')
            print("Disconnected from Tello")
        except Exception as e:
            print(f"Disconnect error: {e}")

    def update_status(self, text, color):
        """Update status display"""
        self.status_label.config(text=f"Status: {text}", fg=color)

    def takeoff(self):
        """Takeoff drone"""
        if not self.connected:
            messagebox.showwarning("Warning", "Connect to drone first!")
            return

        def takeoff_thread():
            try:
                print("Taking off...")
                self.tello.takeoff()
                self.flying = True
                self.root.after(0, lambda: self.update_status("Flying", '#27ae60'))
                print("Takeoff successful!")
            except Exception as e:
                print(f"Takeoff failed: {e}")
                self.root.after(0, lambda: messagebox.showerror("Error", f"Takeoff failed: {e}"))

        threading.Thread(target=takeoff_thread, daemon=True).start()

    def land(self):
        """Land drone"""
        if not self.connected:
            return

        def land_thread():
            try:
                print("Landing...")
                self.tello.land()
                self.flying = False
                self.root.after(0, lambda: self.update_status("Landed", '#f39c12'))
                print("Landing successful!")
            except Exception as e:
                print(f"Landing failed: {e}")

        threading.Thread(target=land_thread, daemon=True).start()

    def move_drone(self, direction):
        """Move drone"""
        if not self.connected or not self.flying:
            messagebox.showwarning("Warning", "Drone must be connected and flying!")
            return

        def move_thread():
            try:
                distance = 30  # cm
                print(f"Moving {direction}...")

                if direction == 'forward':
                    self.tello.move_forward(distance)
                elif direction == 'back':
                    self.tello.move_back(distance)
                elif direction == 'left':
                    self.tello.move_left(distance)
                elif direction == 'right':
                    self.tello.move_right(distance)

                print(f"Move {direction} completed!")

            except Exception as e:
                print(f"Movement failed: {e}")

        threading.Thread(target=move_thread, daemon=True).start()

    def run(self):
        """Run the application"""
        print("Starting GUI...")
        try:
            messagebox.showinfo("Welcome",
                              "Minimal Tello Controller\n\n" +
                              "1. Connect to Tello WiFi\n" +
                              "2. Click CONNECT\n" +
                              "3. Use controls to fly\n\n" +
                              "This is a debug version!")

            self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
            self.root.mainloop()
        except Exception as e:
            print(f"GUI error: {e}")

    def on_closing(self):
        """Handle app closing"""
        if self.connected:
            self.disconnect_drone()
        self.root.destroy()
        print("Application closed")

def main():
    """Main function"""
    print("Starting Minimal DJI Tello Controller...")
    print("=" * 50)

    try:
        app = MinimalTelloController()
        app.run()
    except Exception as e:
        print(f"ERROR: Application error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
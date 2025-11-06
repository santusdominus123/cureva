#!/usr/bin/env python3
"""
DJI Tello ROS2 Drone Controller GUI
Modern Python GUI for drone control with camera feed
With Google Drive Integration
"""

import sys
import cv2
import time
import math
import threading
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk
import numpy as np
from djitellopy import Tello

# Google Drive Integration (optional)
try:
    from drone_gdrive_integration import DroneGDriveUploader
    GDRIVE_AVAILABLE = True
except ImportError:
    GDRIVE_AVAILABLE = False
    print("⚠️ Google Drive integration not available. Install requirements_gdrive.txt to enable.")


class DroneControllerGUI:

    def __init__(self):
        self.root = tk.Tk()
        self.root.title("ROS2 Controller")
        self.root.geometry("1200x800")
        self.root.configure(bg='#1a1a1a')
        
        # Drone instance
        self.tello = None
        self.frame_read = None
        self.connected = False
        self.flying = False
        self.recording = False
        
        # Control variables
        self.speed = tk.IntVar(value=50)
        self.battery_level = tk.StringVar(value="0%")
        self.altitude = tk.StringVar(value="0m")
        self.temperature = tk.StringVar(value="0°C")
        
        # Video frame
        self.current_frame = None
        self.video_thread = None
        self.running = False

        # Google Drive integration
        self.gdrive_uploader = None
        self.gdrive_connected = False
        self.upload_folder = tk.StringVar(value="captures")

        self.setup_ui()
        self.setup_bindings()

        # Initialize Google Drive if available
        if GDRIVE_AVAILABLE:
            self.init_gdrive()
        
    def setup_ui(self):
        """Setup the user interface"""
        # Main container
        main_frame = tk.Frame(self.root, bg='#1a1a1a')
        main_frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Header
        self.create_header(main_frame)
        
        # Content area
        content_frame = tk.Frame(main_frame, bg='#1a1a1a')
        content_frame.pack(fill='both', expand=True, pady=(10, 0))
        
        # Left panel - Video feed
        self.create_video_panel(content_frame)
        
        # Right panel - Controls
        self.create_control_panel(content_frame)
        
    def create_header(self, parent):
        """Create header with branding and status"""
        header_frame = tk.Frame(parent, bg='#2d3748', relief='raised', bd=2)
        header_frame.pack(fill='x', pady=(0, 10))
        
        # Title
        title_frame = tk.Frame(header_frame, bg='#2d3748')
        title_frame.pack(side='left', padx=20, pady=10)
        
        title_label = tk.Label(title_frame, text="ros 2 controller",
                              font=('Arial', 20, 'bold'),
                              fg='#ff6b35', bg='#2d3748')
        title_label.pack()
        
        subtitle_label = tk.Label(title_frame, text="ROS2 Controller",
                                 font=('Arial', 12),
                                 fg='#a0aec0', bg='#2d3748')
        subtitle_label.pack()
        
        # Status indicators
        status_frame = tk.Frame(header_frame, bg='#2d3748')
        status_frame.pack(side='right', padx=20, pady=10)
        
        # Battery
        self.battery_label = tk.Label(status_frame, text="🔋 0%",
                                     font=('Arial', 12, 'bold'),
                                     fg='#48bb78', bg='#2d3748')
        self.battery_label.pack(side='top', anchor='e')
        
        # Connection status
        self.connection_label = tk.Label(status_frame, text="❌ Disconnected",
                                       font=('Arial', 12, 'bold'),
                                       fg='#f56565', bg='#2d3748')
        self.connection_label.pack(side='top', anchor='e')
        
    def create_video_panel(self, parent):
        """Create video feed panel"""
        video_frame = tk.Frame(parent, bg='#2d3748', relief='raised', bd=2)
        video_frame.pack(side='left', fill='both', expand=True, padx=(0, 10))
        
        # Video label
        video_header = tk.Label(video_frame, text="📹 Camera Feed",
                               font=('Arial', 14, 'bold'),
                               fg='#4299e1', bg='#2d3748')
        video_header.pack(pady=10)
        
        # Video display
        self.video_label = tk.Label(video_frame, bg='#000000',
                                   text="Camera feed will appear here\nPress CONNECT to start",
                                   font=('Arial', 16), fg='#a0aec0')
        self.video_label.pack(expand=True, fill='both', padx=10, pady=10)
        
    def create_control_panel(self, parent):
        """Create control panel"""
        control_frame = tk.Frame(parent, bg='#2d3748', relief='raised', bd=2, width=350)
        control_frame.pack(side='right', fill='y')
        control_frame.pack_propagate(False)
        
        # Control header
        control_header = tk.Label(control_frame, text="🎮 Controls",
                                 font=('Arial', 14, 'bold'),
                                 fg='#4299e1', bg='#2d3748')
        control_header.pack(pady=10)
        
        # Connection controls
        self.create_connection_controls(control_frame)
        
        # Flight controls
        self.create_flight_controls(control_frame)
        
        # Movement controls
        self.create_movement_controls(control_frame)
        
        # Advanced controls
        self.create_advanced_controls(control_frame)
        
    def create_connection_controls(self, parent):
        """Create connection control buttons"""
        conn_frame = tk.LabelFrame(parent, text="Connection",
                                  font=('Arial', 12, 'bold'),
                                  fg='#e2e8f0', bg='#2d3748', bd=2)
        conn_frame.pack(fill='x', padx=10, pady=5)
        
        button_frame = tk.Frame(conn_frame, bg='#2d3748')
        button_frame.pack(pady=10)
        
        self.connect_btn = tk.Button(button_frame, text="🟢 CONNECT",
                                    command=self.toggle_connection,
                                    font=('Arial', 12, 'bold'),
                                    bg='#48bb78', fg='white',
                                    relief='raised', bd=3, padx=20, pady=5)
        self.connect_btn.pack(side='left', padx=5)
        
        self.emergency_btn = tk.Button(button_frame, text="🚨 EMERGENCY",
                                      command=self.emergency_stop,
                                      font=('Arial', 12, 'bold'),
                                      bg='#f56565', fg='white',
                                      relief='raised', bd=3, padx=20, pady=5)
        self.emergency_btn.pack(side='right', padx=5)
        
    def create_flight_controls(self, parent):
        """Create flight control buttons"""
        flight_frame = tk.LabelFrame(parent, text="Flight Control",
                                    font=('Arial', 12, 'bold'),
                                    fg='#e2e8f0', bg='#2d3748', bd=2)
        flight_frame.pack(fill='x', padx=10, pady=5)
        
        button_frame = tk.Frame(flight_frame, bg='#2d3748')
        button_frame.pack(pady=10)
        
        self.takeoff_btn = tk.Button(button_frame, text="🚁 TAKEOFF",
                                    command=self.takeoff,
                                    font=('Arial', 12, 'bold'),
                                    bg='#4299e1', fg='white',
                                    relief='raised', bd=3, padx=20, pady=5)
        self.takeoff_btn.pack(side='left', padx=5)
        
        self.land_btn = tk.Button(button_frame, text="🛬 LAND",
                                 command=self.land,
                                 font=('Arial', 12, 'bold'),
                                 bg='#ed8936', fg='white',
                                 relief='raised', bd=3, padx=20, pady=5)
        self.land_btn.pack(side='right', padx=5)
        
    def create_movement_controls(self, parent):
        """Create movement control buttons"""
        move_frame = tk.LabelFrame(parent, text="Movement Controls",
                                  font=('Arial', 12, 'bold'),
                                  fg='#e2e8f0', bg='#2d3748', bd=2)
        move_frame.pack(fill='x', padx=10, pady=5)
        
        # Speed control
        speed_frame = tk.Frame(move_frame, bg='#2d3748')
        speed_frame.pack(pady=5)
        
        tk.Label(speed_frame, text="Speed:", font=('Arial', 10),
                fg='#e2e8f0', bg='#2d3748').pack(side='left')
        
        speed_scale = tk.Scale(speed_frame, from_=10, to=100,
                              orient='horizontal', variable=self.speed,
                              font=('Arial', 10), fg='#e2e8f0', bg='#2d3748',
                              highlightthickness=0, length=200)
        speed_scale.pack(side='right', padx=10)
        
        # Movement buttons grid
        grid_frame = tk.Frame(move_frame, bg='#2d3748')
        grid_frame.pack(pady=10)
        
        # Row 1
        tk.Button(grid_frame, text="↑", command=lambda: self.move_drone('forward'),
                 font=('Arial', 16, 'bold'), bg='#4299e1', fg='white',
                 width=3, height=1, relief='raised', bd=3).grid(row=0, column=1, padx=2, pady=2)
        
        # Row 2
        tk.Button(grid_frame, text="↰", command=lambda: self.move_drone('ccw'),
                 font=('Arial', 16, 'bold'), bg='#9f7aea', fg='white',
                 width=3, height=1, relief='raised', bd=3).grid(row=1, column=0, padx=2, pady=2)
        tk.Button(grid_frame, text="←", command=lambda: self.move_drone('left'),
                 font=('Arial', 16, 'bold'), bg='#4299e1', fg='white',
                 width=3, height=1, relief='raised', bd=3).grid(row=1, column=1, padx=2, pady=2)
        tk.Button(grid_frame, text="→", command=lambda: self.move_drone('right'),
                 font=('Arial', 16, 'bold'), bg='#4299e1', fg='white',
                 width=3, height=1, relief='raised', bd=3).grid(row=1, column=2, padx=2, pady=2)
        tk.Button(grid_frame, text="↱", command=lambda: self.move_drone('cw'),
                 font=('Arial', 16, 'bold'), bg='#9f7aea', fg='white',
                 width=3, height=1, relief='raised', bd=3).grid(row=1, column=3, padx=2, pady=2)
        
        # Row 3
        tk.Button(grid_frame, text="↓", command=lambda: self.move_drone('back'),
                 font=('Arial', 16, 'bold'), bg='#4299e1', fg='white',
                 width=3, height=1, relief='raised', bd=3).grid(row=2, column=1, padx=2, pady=2)
        
        # Altitude controls
        alt_frame = tk.Frame(move_frame, bg='#2d3748')
        alt_frame.pack(pady=5)
        
        tk.Button(alt_frame, text="⬆ UP", command=lambda: self.move_drone('up'),
                 font=('Arial', 12, 'bold'), bg='#48bb78', fg='white',
                 width=8, relief='raised', bd=3).pack(side='left', padx=5)
        tk.Button(alt_frame, text="⬇ DOWN", command=lambda: self.move_drone('down'),
                 font=('Arial', 12, 'bold'), bg='#f56565', fg='white',
                 width=8, relief='raised', bd=3).pack(side='right', padx=5)
        
    def create_advanced_controls(self, parent):
        """Create advanced control features"""
        adv_frame = tk.LabelFrame(parent, text="Advanced Controls",
                                 font=('Arial', 12, 'bold'),
                                 fg='#e2e8f0', bg='#2d3748', bd=2)
        adv_frame.pack(fill='x', padx=10, pady=5)

        # Action buttons
        action_frame = tk.Frame(adv_frame, bg='#2d3748')
        action_frame.pack(pady=10)

        tk.Button(action_frame, text="🎬 Record", command=self.toggle_recording,
                 font=('Arial', 10, 'bold'), bg='#9f7aea', fg='white',
                 relief='raised', bd=3, padx=10).pack(side='left', padx=2)

        tk.Button(action_frame, text="🔄 Flip", command=self.flip,
                 font=('Arial', 10, 'bold'), bg='#ed8936', fg='white',
                 relief='raised', bd=3, padx=10).pack(side='left', padx=2)

        # Auto patterns
        pattern_frame = tk.Frame(adv_frame, bg='#2d3748')
        pattern_frame.pack(pady=5)

        tk.Button(pattern_frame, text="🔄 Circle CW",
                 command=lambda: self.auto_circle(True),
                 font=('Arial', 10, 'bold'), bg='#38b2ac', fg='white',
                 relief='raised', bd=3, width=12).pack(pady=2)

        tk.Button(pattern_frame, text="🔄 Circle CCW",
                 command=lambda: self.auto_circle(False),
                 font=('Arial', 10, 'bold'), bg='#38b2ac', fg='white',
                 relief='raised', bd=3, width=12).pack(pady=2)

        # Google Drive controls (if available)
        if GDRIVE_AVAILABLE:
            gdrive_frame = tk.LabelFrame(adv_frame, text="Google Drive",
                                        font=('Arial', 10, 'bold'),
                                        fg='#e2e8f0', bg='#2d3748', bd=1)
            gdrive_frame.pack(fill='x', padx=5, pady=5)

            # Folder input
            folder_input_frame = tk.Frame(gdrive_frame, bg='#2d3748')
            folder_input_frame.pack(pady=5)

            tk.Label(folder_input_frame, text="Folder:",
                    font=('Arial', 9), fg='#e2e8f0', bg='#2d3748').pack(side='left', padx=5)

            tk.Entry(folder_input_frame, textvariable=self.upload_folder,
                    font=('Arial', 9), bg='#1a202c', fg='#e2e8f0',
                    width=15).pack(side='left', padx=5)

            # Connect button
            tk.Button(gdrive_frame, text="☁️ Connect",
                     command=self.connect_gdrive,
                     font=('Arial', 9, 'bold'), bg='#4299e1', fg='white',
                     relief='raised', bd=3, width=12).pack(pady=2)

            # Capture & Upload button
            tk.Button(gdrive_frame, text="📸 Capture & Upload",
                     command=self.capture_and_upload,
                     font=('Arial', 9, 'bold'), bg='#48bb78', fg='white',
                     relief='raised', bd=3, width=12).pack(pady=2)

            # Open folder button
            tk.Button(gdrive_frame, text="📁 Open Folder",
                     command=self.open_gdrive_folder,
                     font=('Arial', 9, 'bold'), bg='#ed8936', fg='white',
                     relief='raised', bd=3, width=12).pack(pady=2)
        
    def setup_bindings(self):
        """Setup keyboard bindings"""
        self.root.bind('<KeyPress>', self.on_key_press)
        self.root.focus_set()
        
    def on_key_press(self, event):
        """Handle keyboard input"""
        if not self.connected or not self.flying:
            return
            
        key = event.keysym.lower()
        
        movement_map = {
            'w': 'forward', 'up': 'forward',
            's': 'back', 'down': 'back',
            'a': 'left', 'left': 'left',
            'd': 'right', 'right': 'right',
            'q': 'ccw', 'e': 'cw',
            'r': 'up', 'f': 'down'
        }
        
        if key in movement_map:
            self.move_drone(movement_map[key])
        elif key == 'c':
            self.auto_circle(True)
        elif key == 'v':
            self.auto_circle(False)
        elif key == 'space':
            self.flip()
        elif key == 'escape':
            self.emergency_stop()
    
    def toggle_connection(self):
        """Toggle drone connection"""
        if not self.connected:
            self.connect_drone()
        else:
            self.disconnect_drone()
    
    def connect_drone(self):
        """Connect to drone"""
        try:
            self.tello = Tello()
            self.tello.connect()
            
            # Get battery level
            battery = self.tello.get_battery()
            self.battery_label.config(text=f"🔋 {battery}%")
            
            if battery < 15:
                messagebox.showwarning("Low Battery",
                                     f"Battery level is {battery}%. Please charge before flying.")
                return
            
            # Start video stream
            self.tello.streamon()
            self.frame_read = self.tello.get_frame_read()
            
            # Update UI
            self.connected = True
            self.connect_btn.config(text="🔴 DISCONNECT", bg='#f56565')
            self.connection_label.config(text="✅ Connected", fg='#48bb78')
            
            # Start video thread
            self.running = True
            self.video_thread = threading.Thread(target=self.update_video, daemon=True)
            self.video_thread.start()
            
            messagebox.showinfo("Success", "Connected to DJI Tello successfully!")
            
        except Exception as e:
            messagebox.showerror("Connection Error", f"Failed to connect: {str(e)}")
    
    def disconnect_drone(self):
        """Disconnect from drone"""
        try:
            self.running = False
            
            if self.flying:
                self.land()
            
            if self.tello:
                self.tello.streamoff()
                self.tello.end()
            
            # Update UI
            self.connected = False
            self.flying = False
            self.connect_btn.config(text="🟢 CONNECT", bg='#48bb78')
            self.connection_label.config(text="❌ Disconnected", fg='#f56565')
            self.video_label.config(image='', text="Camera feed disconnected")
            
        except Exception as e:
            print(f"Disconnect error: {e}")
    
    def update_video(self):
        """Update video feed"""
        while self.running and self.frame_read:
            try:
                frame = self.frame_read.frame
                if frame is not None:
                    # Store current frame for capture
                    self.current_frame = frame.copy()

                    # Convert frame for tkinter
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                    # Resize frame to fit display
                    height, width = frame_rgb.shape[:2]
                    max_width, max_height = 640, 480

                    if width > max_width or height > max_height:
                        ratio = min(max_width / width, max_height / height)
                        new_width = int(width * ratio)
                        new_height = int(height * ratio)
                        frame_rgb = cv2.resize(frame_rgb, (new_width, new_height))

                    # Convert to PhotoImage
                    image = Image.fromarray(frame_rgb)
                    photo = ImageTk.PhotoImage(image)

                    # Update label
                    self.video_label.config(image=photo, text='')
                    self.video_label.image = photo

                time.sleep(0.033)  # ~30 FPS

            except Exception as e:
                print(f"Video update error: {e}")
                break
    
    def takeoff(self):
        """Takeoff drone"""
        if not self.connected:
            messagebox.showwarning("Not Connected", "Please connect to drone first")
            return
        
        if self.flying:
            messagebox.showinfo("Already Flying", "Drone is already in the air")
            return
        
        try:
            self.tello.takeoff()
            self.flying = True
            messagebox.showinfo("Takeoff", "Drone has taken off successfully!")
        except Exception as e:
            messagebox.showerror("Takeoff Error", f"Failed to takeoff: {str(e)}")
    
    def land(self):
        """Land drone"""
        if not self.connected:
            return
        
        try:
            self.tello.land()
            self.flying = False
            messagebox.showinfo("Landing", "Drone has landed successfully!")
        except Exception as e:
            messagebox.showerror("Landing Error", f"Failed to land: {str(e)}")
    
    def move_drone(self, direction):
        """Move drone in specified direction"""
        if not self.connected or not self.flying:
            return
        
        distance = self.speed.get()
        
        try:
            if direction == 'forward':
                self.tello.move_forward(distance)
            elif direction == 'back':
                self.tello.move_back(distance)
            elif direction == 'left':
                self.tello.move_left(distance)
            elif direction == 'right':
                self.tello.move_right(distance)
            elif direction == 'up':
                self.tello.move_up(distance)
            elif direction == 'down':
                self.tello.move_down(distance)
            elif direction == 'cw':
                self.tello.rotate_clockwise(45)
            elif direction == 'ccw':
                self.tello.rotate_counter_clockwise(45)
        except Exception as e:
            print(f"Movement error: {e}")
    
    def flip(self):
        """Perform flip"""
        if not self.connected or not self.flying:
            return
        
        try:
            self.tello.flip_forward()
        except Exception as e:
            messagebox.showerror("Flip Error", f"Failed to flip: {str(e)}")
    
    def emergency_stop(self):
        """Emergency stop"""
        if self.connected and self.tello:
            try:
                self.tello.emergency()
                self.flying = False
                messagebox.showwarning("Emergency Stop", "Emergency stop activated!")
            except Exception as e:
                print(f"Emergency stop error: {e}")
    
    def toggle_recording(self):
        """Toggle video recording"""
        # This would implement video recording functionality
        self.recording = not self.recording
        status = "Started" if self.recording else "Stopped"
        messagebox.showinfo("Recording", f"Recording {status}")
    
    def auto_circle(self, clockwise=True):
        """Perform automatic circle movement"""
        if not self.connected or not self.flying:
            return
        
        def circle_thread():
            try:
                self.fly_one_full_circle(self.tello, speed=20, radius_cm=45, clockwise=clockwise)
            except Exception as e:
                print(f"Circle movement error: {e}")
        
        threading.Thread(target=circle_thread, daemon=True).start()
    
    def fly_one_full_circle(self, tello, speed, radius_cm, clockwise=True):
        """Fly one full circle (from basic_movement.py)"""
        if radius_cm <= 0 or speed <= 0:
            return

        circumference_cm = 2 * math.pi * radius_cm
        duration_s = circumference_cm / speed
        
        angular_velocity_deg = (speed / radius_cm) * (180 / math.pi)
        correction_factor = 1.7 
        yaw_speed = int(angular_velocity_deg * correction_factor)

        if yaw_speed > 100: 
            yaw_speed = 100
        
        direction_multiplier = 1 if clockwise else -1
        left_right_target = speed * direction_multiplier
        yaw_target = yaw_speed * (-1 * direction_multiplier)

        ramp_time = 1.6
        if duration_s < ramp_time * 2:
            ramp_time = duration_s / 2

        ramp_down_start_time = duration_s - ramp_time
        
        start_time = time.time()
        while True:
            elapsed_time = time.time() - start_time
            if elapsed_time > duration_s:
                break

            progress = 1.0
            if elapsed_time < ramp_time:
                progress = elapsed_time / ramp_time
            elif elapsed_time > ramp_down_start_time:
                progress = (duration_s - elapsed_time) / ramp_time

            current_left_right = int(left_right_target * progress)
            current_yaw = int(yaw_target * progress)
            
            tello.send_rc_control(current_left_right, 0, 0, current_yaw)
            time.sleep(0.05)

        tello.send_rc_control(0, 0, 0, 0)
        time.sleep(1)

    def init_gdrive(self):
        """Initialize Google Drive uploader"""
        try:
            self.gdrive_uploader = DroneGDriveUploader()
            print("📦 Google Drive uploader initialized")
        except Exception as e:
            print(f"Failed to initialize Google Drive: {e}")

    def connect_gdrive(self):
        """Connect to Google Drive"""
        if not GDRIVE_AVAILABLE:
            messagebox.showwarning("Not Available",
                                 "Google Drive integration not installed.\n"
                                 "Install requirements_gdrive.txt to enable.")
            return

        def auth_thread():
            try:
                if self.gdrive_uploader.authenticate():
                    folder = self.upload_folder.get()
                    if self.gdrive_uploader.ensure_folder(folder):
                        self.gdrive_connected = True
                        messagebox.showinfo("Success",
                                          f"✅ Connected to Google Drive\n"
                                          f"📁 Folder: {folder}")
                        # Update UI to show connected status
                        self.root.title(f"DJI Tello ROS2 Controller - 📁 GDrive: {folder}")
                    else:
                        messagebox.showerror("Error", "Failed to create/access folder")
                else:
                    messagebox.showerror("Error", "Authentication failed")
            except Exception as e:
                messagebox.showerror("Error", f"Connection failed: {str(e)}")

        threading.Thread(target=auth_thread, daemon=True).start()

    def capture_and_upload(self):
        """Capture current frame and upload to Google Drive"""
        if not self.gdrive_connected:
            messagebox.showwarning("Not Connected",
                                 "Please connect to Google Drive first")
            return

        if not self.connected or self.current_frame is None:
            messagebox.showwarning("No Frame",
                                 "No video frame available to capture")
            return

        try:
            # Encode current frame to JPEG
            success, buffer = cv2.imencode('.jpg', self.current_frame,
                                         [cv2.IMWRITE_JPEG_QUALITY, 95])

            if not success:
                raise Exception("Failed to encode frame")

            photo_data = buffer.tobytes()
            timestamp = int(time.time() * 1000)
            filename = f"tello_{timestamp}.jpg"

            # Upload to Google Drive
            messagebox.showinfo("Uploading", f"📸 Capturing and uploading...\n{filename}")

            file_id = self.gdrive_uploader.upload_photo(photo_data, filename)

            if file_id:
                messagebox.showinfo("Success",
                                  f"✅ Photo uploaded successfully!\n"
                                  f"📁 {filename}")
            else:
                messagebox.showerror("Error", "Upload failed")

        except Exception as e:
            messagebox.showerror("Error", f"Capture failed: {str(e)}")

    def open_gdrive_folder(self):
        """Open Google Drive folder in browser"""
        if not self.gdrive_connected:
            messagebox.showwarning("Not Connected",
                                 "Please connect to Google Drive first")
            return

        import webbrowser
        link = self.gdrive_uploader.get_folder_link()
        if link:
            webbrowser.open(link)
        else:
            messagebox.showerror("Error", "Failed to get folder link")

    def run(self):
        """Run the GUI application"""
        try:
            self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
            self.root.mainloop()
        except KeyboardInterrupt:
            self.on_closing()

    def on_closing(self):
        """Handle application closing"""
        if self.connected:
            self.disconnect_drone()
        self.root.destroy()


if __name__ == "__main__":
    app = DroneControllerGUI()
    app.run()

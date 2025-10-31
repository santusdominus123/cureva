#!/usr/bin/env python3
"""
DJI Tello ROS2 Drone Controller - Standalone Version
Enhanced Python GUI for drone control with camera feed
Run directly with: python drone_controller.py
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

try:
    from djitellopy import Tello
except ImportError:
    print("❌ djitellopy not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'djitellopy'])
    from djitellopy import Tello

class TelloController:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🚁 DJI Tello ROS2 Controller")
        self.root.geometry("1200x750")  # Reduced window size
        self.root.configure(bg='#0a0a0a')
        self.root.resizable(True, True)
        
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
        
        # Setup UI
        self.setup_styles()
        self.setup_ui()
        self.setup_bindings()
        
    def setup_styles(self):
        """Setup custom styles"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # Configure styles for dark theme
        style.configure('Title.TLabel', 
                       background='#0a0a0a', 
                       foreground='#ff6b35', 
                       font=('Arial', 24, 'bold'))
        
        style.configure('Header.TLabel', 
                       background='#1a1a1a', 
                       foreground='#ffffff', 
                       font=('Arial', 14, 'bold'))
        
        style.configure('Status.TLabel', 
                       background='#1a1a1a', 
                       foreground='#4ade80', 
                       font=('Arial', 12, 'bold'))
        
    def setup_ui(self):
        """Setup the modern user interface"""
        # Configure grid weights - optimized
        self.root.grid_rowconfigure(0, weight=0)
        self.root.grid_rowconfigure(1, weight=1)
        self.root.grid_columnconfigure(0, weight=1)
        self.root.grid_columnconfigure(1, weight=0)
        
        # Header
        self.create_header()
        
        # Main content area
        self.create_main_content()
        
        # Control panel
        self.create_control_panel()
        
    def create_header(self):
        """Create modern header with branding"""
        header_frame = tk.Frame(self.root, bg='#1a1a1a', height=80, relief='flat', bd=0)
        header_frame.grid(row=0, column=0, columnspan=2, sticky='ew', padx=0, pady=0)
        header_frame.grid_propagate(False)
        
        # Left side - branding
        left_frame = tk.Frame(header_frame, bg='#1a1a1a')
        left_frame.pack(side='left', padx=30, pady=20)
        
        # DJI Logo simulation
        logo_frame = tk.Frame(left_frame, bg='#ff6b35', width=40, height=40)
        logo_frame.pack(side='left', padx=(0, 15))
        logo_frame.pack_propagate(False)
        
        logo_inner = tk.Frame(logo_frame, bg='#ffffff', width=20, height=20)
        logo_inner.place(relx=0.5, rely=0.5, anchor='center')
        
        # Title
        title_frame = tk.Frame(left_frame, bg='#1a1a1a')
        title_frame.pack(side='left')
        
        title_label = tk.Label(title_frame, text="DJI Tello", 
                              font=('Arial', 22, 'bold'), 
                              fg='#ff6b35', bg='#1a1a1a')
        title_label.pack(anchor='w')
        
        subtitle_label = tk.Label(title_frame, text="ROS2 Controller", 
                                 font=('Arial', 12), 
                                 fg='#a0aec0', bg='#1a1a1a')
        subtitle_label.pack(anchor='w')
        
        # Right side - status
        right_frame = tk.Frame(header_frame, bg='#1a1a1a')
        right_frame.pack(side='right', padx=30, pady=20)
        
        # Status indicators
        self.create_status_indicators(right_frame)
        
    def create_status_indicators(self, parent):
        """Create status indicator badges"""
        # Connection status
        self.connection_frame = tk.Frame(parent, bg='#dc2626', relief='flat', bd=0)
        self.connection_frame.pack(side='top', anchor='e', pady=(0, 8))
        
        self.connection_label = tk.Label(self.connection_frame, text="❌ OFFLINE", 
                                       font=('Arial', 11, 'bold'),
                                       fg='white', bg='#dc2626', padx=12, pady=6)
        self.connection_label.pack()
        
        # Battery status  
        self.battery_frame = tk.Frame(parent, bg='#6b7280', relief='flat', bd=0)
        self.battery_frame.pack(side='top', anchor='e')
        
        self.battery_label = tk.Label(self.battery_frame, text="🔋 0%", 
                                     font=('Arial', 11, 'bold'),
                                     fg='white', bg='#6b7280', padx=12, pady=6)
        self.battery_label.pack()
        
    def create_main_content(self):
        """Create main video display area"""
        video_frame = tk.Frame(self.root, bg='#000000', relief='flat', bd=2)
        video_frame.grid(row=1, column=0, sticky='nsew', padx=20, pady=(10, 20))
        
        # Video header
        video_header_frame = tk.Frame(video_frame, bg='#1a1a1a', height=40)
        video_header_frame.pack(fill='x', side='top')
        video_header_frame.pack_propagate(False)
        
        video_header = tk.Label(video_header_frame, text="📹 Live Camera Feed", 
                               font=('Arial', 14, 'bold'),
                               fg='#60a5fa', bg='#1a1a1a')
        video_header.pack(pady=10)
        
        # Video display
        self.video_label = tk.Label(video_frame, bg='#000000', 
                                   text="Connect to drone to see camera feed\\n\\nMake sure your DJI Tello is:\\n• Powered on\\n• In WiFi mode\\n• Connected to this computer",
                                   font=('Arial', 16), fg='#6b7280',
                                   justify='center')
        self.video_label.pack(expand=True, fill='both', padx=20, pady=20)
        
    def create_control_panel(self):
        """Create comprehensive control panel"""
        control_frame = tk.Frame(self.root, bg='#1a1a1a', width=350, relief='flat', bd=0)  # Reduced width
        control_frame.grid(row=1, column=1, sticky='ns', padx=(0, 20), pady=(10, 20))
        control_frame.grid_propagate(False)
        
        # Control header
        control_header = tk.Label(control_frame, text="🎮 Drone Controls", 
                                 font=('Arial', 16, 'bold'),
                                 fg='#60a5fa', bg='#1a1a1a')
        control_header.pack(pady=(0, 20))
        
        # Connection section
        self.create_connection_section(control_frame)
        
        # Flight section
        self.create_flight_section(control_frame)
        
        # Movement section
        self.create_movement_section(control_frame)
        
        # Advanced section
        self.create_advanced_section(control_frame)
        
    def create_connection_section(self, parent):
        """Create connection controls"""
        section_frame = tk.LabelFrame(parent, text="🔗 Connection", 
                                     font=('Arial', 12, 'bold'),
                                     fg='#e5e7eb', bg='#1a1a1a', 
                                     relief='flat', bd=1, labelanchor='n')
        section_frame.pack(fill='x', padx=20, pady=(0, 15))
        
        btn_frame = tk.Frame(section_frame, bg='#1a1a1a')
        btn_frame.pack(pady=15)
        
        self.connect_btn = tk.Button(btn_frame, text="🟢 CONNECT", 
                                    command=self.toggle_connection,
                                    font=('Arial', 13, 'bold'),
                                    bg='#10b981', fg='white', relief='flat',
                                    bd=0, padx=25, pady=10, cursor='hand2',
                                    activebackground='#059669', activeforeground='white')
        self.connect_btn.pack(side='left', padx=(0, 10))
        
        self.emergency_btn = tk.Button(btn_frame, text="🚨 EMERGENCY", 
                                      command=self.emergency_stop,
                                      font=('Arial', 13, 'bold'),
                                      bg='#dc2626', fg='white', relief='flat',
                                      bd=0, padx=25, pady=10, cursor='hand2',
                                      activebackground='#b91c1c', activeforeground='white')
        self.emergency_btn.pack(side='right')
        
    def create_flight_section(self, parent):
        """Create flight controls"""
        section_frame = tk.LabelFrame(parent, text="✈️ Flight Control", 
                                     font=('Arial', 12, 'bold'),
                                     fg='#e5e7eb', bg='#1a1a1a', 
                                     relief='flat', bd=1, labelanchor='n')
        section_frame.pack(fill='x', padx=20, pady=(0, 15))
        
        btn_frame = tk.Frame(section_frame, bg='#1a1a1a')
        btn_frame.pack(pady=15)
        
        self.takeoff_btn = tk.Button(btn_frame, text="🚁 TAKEOFF", 
                                    command=self.takeoff,
                                    font=('Arial', 13, 'bold'),
                                    bg='#2563eb', fg='white', relief='flat',
                                    bd=0, padx=25, pady=10, cursor='hand2',
                                    activebackground='#1d4ed8', activeforeground='white')
        self.takeoff_btn.pack(side='left', padx=(0, 10))
        
        self.land_btn = tk.Button(btn_frame, text="🛬 LAND", 
                                 command=self.land,
                                 font=('Arial', 13, 'bold'),
                                 bg='#f59e0b', fg='white', relief='flat',
                                 bd=0, padx=25, pady=10, cursor='hand2',
                                 activebackground='#d97706', activeforeground='white')
        self.land_btn.pack(side='right')
        
    def create_movement_section(self, parent):
        """Create movement controls"""
        section_frame = tk.LabelFrame(parent, text="🕹️ Movement Controls", 
                                     font=('Arial', 12, 'bold'),
                                     fg='#e5e7eb', bg='#1a1a1a', 
                                     relief='flat', bd=1, labelanchor='n')
        section_frame.pack(fill='x', padx=20, pady=(0, 15))
        
        # Speed control
        speed_frame = tk.Frame(section_frame, bg='#1a1a1a')
        speed_frame.pack(pady=(15, 10))
        
        speed_label = tk.Label(speed_frame, text="Speed Control:", 
                              font=('Arial', 11, 'bold'),
                              fg='#e5e7eb', bg='#1a1a1a')
        speed_label.pack(anchor='w')
        
        speed_scale = tk.Scale(speed_frame, from_=10, to=100,
                              orient='horizontal', variable=self.speed,
                              font=('Arial', 9), fg='#e5e7eb', bg='#374151',
                              troughcolor='#4b5563', activebackground='#60a5fa',
                              highlightthickness=0, length=250, width=15)  # Reduced size
        speed_scale.pack(pady=(5, 0))
        
        # Movement grid
        grid_frame = tk.Frame(section_frame, bg='#1a1a1a')
        grid_frame.pack(pady=15)
        
        # Create movement buttons in grid layout
        self.create_movement_grid(grid_frame)
        
        # Altitude controls
        alt_frame = tk.Frame(section_frame, bg='#1a1a1a')
        alt_frame.pack(pady=(10, 15))
        
        alt_label = tk.Label(alt_frame, text="Altitude Control:", 
                            font=('Arial', 11, 'bold'),
                            fg='#e5e7eb', bg='#1a1a1a')
        alt_label.pack()
        
        alt_btn_frame = tk.Frame(alt_frame, bg='#1a1a1a')
        alt_btn_frame.pack(pady=(5, 0))
        
        up_btn = tk.Button(alt_btn_frame, text="⬆ UP", 
                          command=lambda: self.move_drone('up'),
                          font=('Arial', 12, 'bold'), bg='#10b981', fg='white',
                          relief='flat', bd=0, padx=20, pady=8, cursor='hand2',
                          activebackground='#059669', activeforeground='white')
        up_btn.pack(side='left', padx=(0, 10))
        
        down_btn = tk.Button(alt_btn_frame, text="⬇ DOWN", 
                            command=lambda: self.move_drone('down'),
                            font=('Arial', 12, 'bold'), bg='#dc2626', fg='white',
                            relief='flat', bd=0, padx=20, pady=8, cursor='hand2',
                            activebackground='#b91c1c', activeforeground='white')
        down_btn.pack(side='right')
        
    def create_movement_grid(self, parent):
        """Create directional movement grid"""
        # Grid layout for movement controls
        
        # Row 0 - Forward
        forward_btn = tk.Button(parent, text="↑", 
                               command=lambda: self.move_drone('forward'),
                               font=('Arial', 18, 'bold'), bg='#2563eb', fg='white',
                               relief='flat', bd=0, width=4, height=2, cursor='hand2',
                               activebackground='#1d4ed8', activeforeground='white')
        forward_btn.grid(row=0, column=1, padx=2, pady=2)
        
        # Row 1 - Left, Center, Right, with rotation
        ccw_btn = tk.Button(parent, text="↺", 
                           command=lambda: self.move_drone('ccw'),
                           font=('Arial', 18, 'bold'), bg='#7c3aed', fg='white',
                           relief='flat', bd=0, width=4, height=2, cursor='hand2',
                           activebackground='#6d28d9', activeforeground='white')
        ccw_btn.grid(row=1, column=0, padx=2, pady=2)
        
        left_btn = tk.Button(parent, text="←", 
                            command=lambda: self.move_drone('left'),
                            font=('Arial', 18, 'bold'), bg='#2563eb', fg='white',
                            relief='flat', bd=0, width=4, height=2, cursor='hand2',
                            activebackground='#1d4ed8', activeforeground='white')
        left_btn.grid(row=1, column=1, padx=2, pady=2)
        
        right_btn = tk.Button(parent, text="→", 
                             command=lambda: self.move_drone('right'),
                             font=('Arial', 18, 'bold'), bg='#2563eb', fg='white',
                             relief='flat', bd=0, width=4, height=2, cursor='hand2',
                             activebackground='#1d4ed8', activeforeground='white')
        right_btn.grid(row=1, column=2, padx=2, pady=2)
        
        cw_btn = tk.Button(parent, text="↻", 
                          command=lambda: self.move_drone('cw'),
                          font=('Arial', 18, 'bold'), bg='#7c3aed', fg='white',
                          relief='flat', bd=0, width=4, height=2, cursor='hand2',
                          activebackground='#6d28d9', activeforeground='white')
        cw_btn.grid(row=1, column=3, padx=2, pady=2)
        
        # Row 2 - Backward
        backward_btn = tk.Button(parent, text="↓", 
                                command=lambda: self.move_drone('back'),
                                font=('Arial', 18, 'bold'), bg='#2563eb', fg='white',
                                relief='flat', bd=0, width=4, height=2, cursor='hand2',
                                activebackground='#1d4ed8', activeforeground='white')
        backward_btn.grid(row=2, column=1, padx=2, pady=2)
        
    def create_advanced_section(self, parent):
        """Create advanced controls"""
        section_frame = tk.LabelFrame(parent, text="🎛️ Advanced Controls", 
                                     font=('Arial', 12, 'bold'),
                                     fg='#e5e7eb', bg='#1a1a1a', 
                                     relief='flat', bd=1, labelanchor='n')
        section_frame.pack(fill='x', padx=20, pady=(0, 15))
        
        # Action buttons
        action_frame = tk.Frame(section_frame, bg='#1a1a1a')
        action_frame.pack(pady=15)
        
        flip_btn = tk.Button(action_frame, text="🔄 FLIP", 
                            command=self.flip,
                            font=('Arial', 11, 'bold'), bg='#f59e0b', fg='white',
                            relief='flat', bd=0, padx=15, pady=8, cursor='hand2',
                            activebackground='#d97706', activeforeground='white')
        flip_btn.pack(side='left', padx=(0, 5))
        
        record_btn = tk.Button(action_frame, text="🎬 RECORD", 
                              command=self.toggle_recording,
                              font=('Arial', 11, 'bold'), bg='#7c3aed', fg='white',
                              relief='flat', bd=0, padx=15, pady=8, cursor='hand2',
                              activebackground='#6d28d9', activeforeground='white')
        record_btn.pack(side='right', padx=(5, 0))
        
        # Auto pattern section
        pattern_frame = tk.Frame(section_frame, bg='#1a1a1a')
        pattern_frame.pack(pady=(10, 15))
        
        pattern_label = tk.Label(pattern_frame, text="Auto Flight Patterns:", 
                                font=('Arial', 11, 'bold'),
                                fg='#e5e7eb', bg='#1a1a1a')
        pattern_label.pack()
        
        pattern_btn_frame = tk.Frame(pattern_frame, bg='#1a1a1a')
        pattern_btn_frame.pack(pady=(5, 0))
        
        circle_cw_btn = tk.Button(pattern_btn_frame, text="🔄 Circle CW", 
                                 command=lambda: self.auto_circle(True),
                                 font=('Arial', 10, 'bold'), bg='#059669', fg='white',
                                 relief='flat', bd=0, padx=12, pady=6, cursor='hand2',
                                 activebackground='#047857', activeforeground='white')
        circle_cw_btn.pack(pady=2, fill='x')
        
        circle_ccw_btn = tk.Button(pattern_btn_frame, text="🔄 Circle CCW", 
                                  command=lambda: self.auto_circle(False),
                                  font=('Arial', 10, 'bold'), bg='#059669', fg='white',
                                  relief='flat', bd=0, padx=12, pady=6, cursor='hand2',
                                  activebackground='#047857', activeforeground='white')
        circle_ccw_btn.pack(pady=2, fill='x')
        
        # Keyboard shortcuts info
        shortcuts_frame = tk.Frame(section_frame, bg='#1a1a1a')
        shortcuts_frame.pack(pady=(10, 15))
        
        shortcuts_label = tk.Label(shortcuts_frame, text="⌨️ Keyboard Shortcuts:", 
                                  font=('Arial', 11, 'bold'),
                                  fg='#e5e7eb', bg='#1a1a1a')
        shortcuts_label.pack()
        
        shortcuts_text = tk.Label(shortcuts_frame, 
                                 text="WASD: Move • QE: Rotate\\nRF: Up/Down • Space: Flip\\nC: Circle CW • V: Circle CCW\\nESC: Emergency Stop", 
                                 font=('Arial', 9),
                                 fg='#9ca3af', bg='#1a1a1a',
                                 justify='left')
        shortcuts_text.pack(pady=(5, 0))
        
    def setup_bindings(self):
        """Setup keyboard shortcuts"""
        self.root.bind('<KeyPress>', self.on_key_press)
        self.root.focus_set()
        
        # Make window focusable
        self.root.bind('<Button-1>', lambda e: self.root.focus_set())
        
    def on_key_press(self, event):
        """Handle keyboard shortcuts"""
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
        """Connect to drone with improved error handling - non-blocking"""
        def connect_thread():
            try:
                print("Attempting to connect to DJI Tello...")
                print("Tello should be at: 192.168.10.1:8889")

                # Create Tello instance with timeout handling
                self.tello = Tello()

                # Try connection with custom timeout
                print("Sending connection command...")
                self.tello.connect()

                # Test if connection is working by getting battery
                print("Testing connection with battery query...")
                try:
                    battery = self.tello.get_battery()
                    print(f"SUCCESS: Battery level received: {battery}%")
                except Exception as battery_error:
                    print(f"WARNING: Battery query failed: {battery_error}")
                    # Try to get battery again with longer timeout
                    import time
                    time.sleep(2)
                    battery = self.tello.get_battery()

                # Schedule UI updates in main thread
                self.root.after(0, self.on_connection_success, battery)

            except Exception as e:
                # Schedule error handling in main thread
                self.root.after(0, self.on_connection_error, str(e))

        # Start connection in background thread
        self.connect_btn.config(text="Connecting...", state='disabled')
        self.connection_label.config(text="⏳ CONNECTING...")
        threading.Thread(target=connect_thread, daemon=True).start()

    def on_connection_success(self, battery):
        """Handle successful connection - runs in main thread"""
        try:
            self.battery_label.config(text=f"🔋 {battery}%")
            
            # Update battery status color
            if battery < 20:
                self.battery_frame.config(bg='#dc2626')
                self.battery_label.config(bg='#dc2626')
                messagebox.showwarning("Low Battery", 
                                     f"Battery level is {battery}%. Please charge before flying.")
            elif battery < 50:
                self.battery_frame.config(bg='#f59e0b')
                self.battery_label.config(bg='#f59e0b')
            else:
                self.battery_frame.config(bg='#10b981')
                self.battery_label.config(bg='#10b981')
            
            # Start video stream
            print("Starting video stream...")
            try:
                self.tello.streamon()
                self.frame_read = self.tello.get_frame_read()
                print("SUCCESS: Video stream started")
            except Exception as video_error:
                print(f"WARNING: Video stream failed: {video_error}")
                print("Continuing without video feed...")
                self.frame_read = None
            
            # Update UI
            self.connected = True
            self.connect_btn.config(text="🔴 DISCONNECT", bg='#dc2626', 
                                   activebackground='#b91c1c', state='normal')
            self.connection_frame.config(bg='#10b981')
            self.connection_label.config(text="✅ ONLINE", bg='#10b981')
            
            # Start video thread with lower priority
            self.running = True
            self.video_thread = threading.Thread(target=self.update_video, daemon=True)
            self.video_thread.start()

            # Start status monitoring thread
            self.status_thread = threading.Thread(target=self.update_status_periodically, daemon=True)
            self.status_thread.start()
            
            messagebox.showinfo("Success", f"Connected to DJI Tello!\\nBattery: {battery}%")
            print("Connection established successfully!")
            
        except Exception as e:
            self.connect_btn.config(text="🟢 CONNECT", state='normal')
            self.connection_label.config(text="❌ OFFLINE")
            
            # Provide detailed troubleshooting
            error_msg = str(e)
            print(f"CONNECTION FAILED: {error_msg}")
            
            troubleshooting = """
TROUBLESHOOTING STEPS:

1. POWER & WIFI:
   • Make sure DJI Tello is powered ON
   • Ensure Tello is in WiFi mode (blinking yellow/blue light)
   • Wait for Tello to fully boot up (30-60 seconds)

2. WIFI CONNECTION:
   • Connect your computer to 'TELLO-XXXXXX' WiFi network
   • Password is usually blank or check Tello manual
   • Disconnect from other WiFi networks

3. NETWORK SETTINGS:
   • Ensure no VPN is running
   • Disable Windows Firewall temporarily
   • Check if IP 192.168.10.1 is reachable

4. RESTART SEQUENCE:
   • Close this application
   • Power off Tello for 10 seconds
   • Power on Tello and wait for WiFi mode
   • Reconnect to Tello WiFi
   • Restart this application

5. ALTERNATIVE:
   • Try the DJI Tello app first to verify drone works
   • Update Tello firmware if needed
            """
            
            messagebox.showerror("Connection Failed", 
                               f"Failed to connect to DJI Tello:\\n\\n{error_msg}\\n\\n{troubleshooting}")
            print(troubleshooting)
    
    def disconnect_drone(self):
        """Disconnect from drone"""
        try:
            self.running = False
            
            if self.flying:
                self.land()
                time.sleep(2)
            
            if self.tello:
                self.tello.streamoff()
                self.tello.end()
            
            # Update UI
            self.connected = False
            self.flying = False
            self.connect_btn.config(text="🟢 CONNECT", bg='#10b981', 
                                   activebackground='#059669')
            self.connection_frame.config(bg='#dc2626')
            self.connection_label.config(text="❌ OFFLINE", bg='#dc2626')
            self.battery_frame.config(bg='#6b7280')
            self.battery_label.config(text="🔋 0%", bg='#6b7280')
            self.video_label.config(image='', text="Disconnected from drone\\n\\nClick CONNECT to reconnect")
            
        except Exception as e:
            print(f"Disconnect error: {e}")
    
    def update_video(self):
        """Update video feed continuously - optimized"""
        frame_count = 0
        skip_frames = 2  # Skip frames for better performance

        while self.running and self.frame_read:
            try:
                frame = self.frame_read.frame
                if frame is not None:
                    frame_count += 1

                    # Skip frames to reduce CPU load
                    if frame_count % skip_frames != 0:
                        time.sleep(0.05)
                        continue

                    # Resize frame first to reduce processing load
                    height, width = frame.shape[:2]
                    max_width, max_height = 640, 480  # Reduced resolution

                    if width > max_width or height > max_height:
                        ratio = min(max_width/width, max_height/height)
                        new_width = int(width * ratio)
                        new_height = int(height * ratio)
                        frame = cv2.resize(frame, (new_width, new_height), interpolation=cv2.INTER_LINEAR)
                        height, width = new_height, new_width

                    # Convert frame for tkinter
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                    # Simplified overlay (less CPU intensive)
                    status_text = "FLYING" if self.flying else "LANDED"
                    cv2.putText(frame_rgb, status_text, (10, 30),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0) if self.flying else (255, 255, 0), 2)

                    # Simple crosshair
                    center_x, center_y = width // 2, height // 2
                    cv2.line(frame_rgb, (center_x - 15, center_y), (center_x + 15, center_y), (255, 255, 255), 1)
                    cv2.line(frame_rgb, (center_x, center_y - 15), (center_x, center_y + 15), (255, 255, 255), 1)

                    # Convert to PhotoImage
                    image = Image.fromarray(frame_rgb)
                    photo = ImageTk.PhotoImage(image)

                    # Update label
                    self.video_label.config(image=photo, text='')
                    self.video_label.image = photo

                time.sleep(0.066)  # ~15 FPS instead of 30

            except Exception as e:
                print(f"Video update error: {e}")
                break

    def update_status_periodically(self):
        """Update drone status periodically - optimized"""
        while self.connected:
            try:
                if self.tello:
                    # Get battery less frequently to reduce overhead
                    battery = self.tello.get_battery()
                    self.battery_label.config(text=f"🔋 {battery}%")

                    # Update battery color based on level
                    if battery < 20:
                        bg_color = '#dc2626'
                    elif battery < 50:
                        bg_color = '#f59e0b'
                    else:
                        bg_color = '#10b981'

                    self.battery_frame.config(bg=bg_color)
                    self.battery_label.config(bg=bg_color)

                time.sleep(5)  # Update every 5 seconds instead of 1

            except Exception as e:
                print(f"Status update error: {e}")
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
            self.takeoff_btn.config(text="Taking off...", state='disabled')
            self.root.update()
            
            self.tello.takeoff()
            self.flying = True
            
            self.takeoff_btn.config(text="🚁 TAKEOFF", state='normal')
            messagebox.showinfo("Success", "Drone has taken off successfully!\\n\\nUse WASD keys or buttons to control movement")
            
        except Exception as e:
            self.takeoff_btn.config(text="🚁 TAKEOFF", state='normal')
            messagebox.showerror("Takeoff Error", f"Failed to takeoff:\\n{str(e)}")
    
    def land(self):
        """Land drone"""
        if not self.connected:
            return
        
        try:
            self.land_btn.config(text="Landing...", state='disabled')
            self.root.update()
            
            self.tello.land()
            self.flying = False
            
            self.land_btn.config(text="🛬 LAND", state='normal')
            messagebox.showinfo("Success", "Drone has landed successfully!")
            
        except Exception as e:
            self.land_btn.config(text="🛬 LAND", state='normal') 
            messagebox.showerror("Landing Error", f"Failed to land:\\n{str(e)}")
    
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
            messagebox.showerror("Movement Error", f"Failed to move {direction}:\\n{str(e)}")
    
    def flip(self):
        """Perform flip maneuver"""
        if not self.connected or not self.flying:
            messagebox.showwarning("Cannot Flip", "Drone must be connected and flying to perform flip")
            return
        
        try:
            result = messagebox.askyesno("Confirm Flip", "Perform forward flip?\\n\\nMake sure there is enough space around the drone!")
            if result:
                self.tello.flip_forward()
                messagebox.showinfo("Success", "Flip completed!")
        except Exception as e:
            messagebox.showerror("Flip Error", f"Failed to flip:\\n{str(e)}")
    
    def emergency_stop(self):
        """Emergency stop - immediate halt"""
        if self.connected and self.tello:
            try:
                result = messagebox.askyesno("Emergency Stop", "Execute emergency stop?\\n\\nThis will immediately cut power to rotors!\\nThe drone may fall and be damaged.")
                if result:
                    self.tello.emergency()
                    self.flying = False
                    messagebox.showwarning("Emergency Stop", "Emergency stop activated!\\nDrone motors have been stopped.")
            except Exception as e:
                print(f"Emergency stop error: {e}")
    
    def toggle_recording(self):
        """Toggle video recording"""
        self.recording = not self.recording
        status = "Started" if self.recording else "Stopped"
        messagebox.showinfo("Recording", f"Video recording {status}\\n\\nNote: This is a placeholder feature.\\nActual recording implementation would save video to file.")
    
    def auto_circle(self, clockwise=True):
        """Perform automatic circle flight"""
        if not self.connected or not self.flying:
            messagebox.showwarning("Cannot Execute Pattern", "Drone must be connected and flying to execute auto patterns")
            return
        
        direction = "clockwise" if clockwise else "counter-clockwise"
        result = messagebox.askyesno("Auto Circle Flight", 
                                   f"Execute {direction} circle flight?\\n\\nMake sure there is enough space (3+ meters radius)\\naround the drone!")
        
        if not result:
            return
        
        def circle_thread():
            try:
                messagebox.showinfo("Circle Flight", f"Starting {direction} circle flight...\\n\\nDuration: ~15 seconds")
                self.fly_one_full_circle(self.tello, speed=25, radius_cm=60, clockwise=clockwise)
                messagebox.showinfo("Success", f"{direction.title()} circle flight completed!")
            except Exception as e:
                messagebox.showerror("Circle Flight Error", f"Failed to complete circle flight:\\n{str(e)}")
        
        threading.Thread(target=circle_thread, daemon=True).start()
    
    def fly_one_full_circle(self, tello, speed, radius_cm, clockwise=True):
        """Execute one full circle flight pattern"""
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
    
    def run(self):
        """Run the application"""
        try:
            self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
            
            # Show welcome message
            welcome_msg = """🚁 DJI Tello ROS2 Controller Ready!

🔗 Getting Started:
1. Make sure your DJI Tello is powered on
2. Connect your computer to the Tello WiFi network  
3. Click 'CONNECT' to establish connection
4. Click 'TAKEOFF' to start flying
5. Use buttons or WASD keys to control movement

⚠️ Safety Reminders:
• Always fly in open areas away from people
• Monitor battery level (land before 15%)
• Keep drone in visual sight at all times
• Use EMERGENCY STOP if needed

⌨️ Keyboard Controls:
WASD: Move • QE: Rotate • RF: Up/Down
Space: Flip • C/V: Circle • ESC: Emergency

Enjoy flying! 🎮"""
            
            messagebox.showinfo("Welcome", welcome_msg)
            
            self.root.mainloop()
            
        except KeyboardInterrupt:
            self.on_closing()
    
    def on_closing(self):
        """Handle application closing"""
        if self.connected:
            self.disconnect_drone()
        self.root.destroy()

def check_tello_network():
    """Check if Tello network is available"""
    import socket
    try:
        # Try to ping Tello IP
        socket.setdefaulttimeout(3)
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('192.168.10.1', 8889))
        sock.close()
        return result == 0
    except:
        return False

def main():
    """Main function"""
    print("Starting DJI Tello ROS2 Controller...")
    print("Checking dependencies...")
    
    # Check for required modules
    required_modules = ['cv2', 'PIL', 'numpy']
    missing_modules = []
    
    for module in required_modules:
        try:
            __import__(module)
            print(f"OK: {module}")
        except ImportError:
            missing_modules.append(module)
            print(f"ERROR: {module}")
    
    if missing_modules:
        print(f"\nWARNING: Missing modules: {', '.join(missing_modules)}")
        print("Installing missing dependencies...")
        
        module_map = {
            'cv2': 'opencv-python',
            'PIL': 'Pillow', 
            'numpy': 'numpy'
        }
        
        for module in missing_modules:
            package_name = module_map.get(module, module)
            try:
                import subprocess
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', package_name])
                print(f"SUCCESS: Installed {package_name}")
            except subprocess.CalledProcessError:
                print(f"ERROR: Failed to install {package_name}")
                return
    
    # Check network connectivity to Tello
    print("\nChecking Tello network connectivity...")
    if check_tello_network():
        print("SUCCESS: Tello network (192.168.10.1) is reachable!")
    else:
        print("WARNING: Cannot reach Tello at 192.168.10.1")
        print("Make sure you're connected to Tello WiFi network!")
        print("Network name should be: TELLO-XXXXXX")
    
    print("\nLaunching GUI...")
    app = TelloController()
    app.run()

if __name__ == "__main__":
    main()
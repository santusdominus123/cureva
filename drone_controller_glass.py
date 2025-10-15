#!/usr/bin/env python3
"""
DJI Tello Controller - Modern Glass UI
Clean glass design optimized for laptop screens with WASD controls
"""

import sys
import cv2
import time
import math
import threading
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk, ImageFilter
import numpy as np
import queue

try:
    from djitellopy import Tello
except ImportError:
    print("❌ djitellopy not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'djitellopy'])
    from djitellopy import Tello

class GlassTelloController:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("DJI Tello - Glass UI")
        self.root.geometry("900x600")  # Compact laptop size
        self.root.configure(bg='#0f0f23')  # Dark blue background
        self.root.resizable(True, True)

        # Remove window decorations for modern look
        self.root.overrideredirect(True)

        # Make window draggable
        self.setup_window_drag()

        # Drone instance
        self.tello = None
        self.frame_read = None
        self.connected = False
        self.flying = False

        # Threading control
        self.running = False
        self.video_thread = None
        self.status_thread = None

        # Message queue for thread communication
        self.message_queue = queue.Queue()

        # Control variables
        self.speed = tk.IntVar(value=50)
        self.battery_level = tk.StringVar(value="0%")

        # Video frame
        self.current_frame = None

        # Setup UI
        self.setup_glass_ui()
        self.setup_bindings()

        # Start message processor
        self.process_messages()

    def setup_window_drag(self):
        """Make window draggable"""
        def start_drag(event):
            self.x = event.x
            self.y = event.y

        def drag_window(event):
            deltax = event.x - self.x
            deltay = event.y - self.y
            x = self.root.winfo_x() + deltax
            y = self.root.winfo_y() + deltay
            self.root.geometry(f"+{x}+{y}")

        self.root.bind('<Button-1>', start_drag)
        self.root.bind('<B1-Motion>', drag_window)

    def create_glass_frame(self, parent, bg_color='#1a1a2e', alpha=0.3):
        """Create glass-like frame with blur effect"""
        frame = tk.Frame(parent, bg=bg_color, relief='flat', bd=0)

        # Add subtle border for glass effect
        canvas = tk.Canvas(frame, highlightthickness=0, bg=bg_color, height=2)
        canvas.pack(fill='x', side='top')
        canvas.create_line(0, 0, 900, 0, fill='#ffffff', width=1, stipple='gray50')

        return frame

    def setup_glass_ui(self):
        """Setup modern glass UI"""
        # Main container with gradient background
        main_container = tk.Frame(self.root, bg='#0f0f23')
        main_container.pack(fill='both', expand=True, padx=1, pady=1)

        # Title bar with glass effect
        self.create_title_bar(main_container)

        # Main content area
        content_frame = tk.Frame(main_container, bg='#0f0f23')
        content_frame.pack(fill='both', expand=True, padx=8, pady=8)

        # Configure grid
        content_frame.grid_rowconfigure(0, weight=1)
        content_frame.grid_columnconfigure(0, weight=1)
        content_frame.grid_columnconfigure(1, weight=0)

        # Video area with glass border
        self.create_video_area(content_frame)

        # Control panel with glass effect
        self.create_glass_control_panel(content_frame)

    def create_title_bar(self, parent):
        """Create modern title bar with glass effect"""
        title_frame = self.create_glass_frame(parent, '#16213e', 0.8)
        title_frame.pack(fill='x', pady=(0, 8))

        # Left side - Logo and title
        left_frame = tk.Frame(title_frame, bg='#16213e')
        left_frame.pack(side='left', padx=15, pady=8)

        # Minimalist logo
        logo_canvas = tk.Canvas(left_frame, width=24, height=24, bg='#16213e', highlightthickness=0)
        logo_canvas.pack(side='left', padx=(0, 10))

        # Draw simple drone icon
        logo_canvas.create_oval(8, 8, 16, 16, fill='#00d4ff', outline='#00d4ff', width=2)
        logo_canvas.create_line(4, 12, 20, 12, fill='#00d4ff', width=2)
        logo_canvas.create_line(12, 4, 12, 20, fill='#00d4ff', width=2)

        title_label = tk.Label(left_frame, text="DJI Tello Glass",
                              font=('Segoe UI', 16, 'bold'),
                              fg='#ffffff', bg='#16213e')
        title_label.pack(side='left')

        # Right side - Status and controls
        right_frame = tk.Frame(title_frame, bg='#16213e')
        right_frame.pack(side='right', padx=15, pady=8)

        # Connection status
        self.connection_status = tk.Label(right_frame, text="● OFFLINE",
                                        font=('Segoe UI', 10, 'bold'),
                                        fg='#ff4757', bg='#16213e')
        self.connection_status.pack(side='left', padx=(0, 15))

        # Battery status
        self.battery_status = tk.Label(right_frame, text="🔋 0%",
                                     font=('Segoe UI', 10, 'bold'),
                                     fg='#747d8c', bg='#16213e')
        self.battery_status.pack(side='left', padx=(0, 15))

        # Window controls
        controls_frame = tk.Frame(right_frame, bg='#16213e')
        controls_frame.pack(side='right')

        minimize_btn = tk.Button(controls_frame, text="—", font=('Segoe UI', 12, 'bold'),
                               fg='#747d8c', bg='#16213e', bd=0, padx=8, pady=2,
                               command=self.minimize_window, cursor='hand2',
                               activebackground='#2c3e50', activeforeground='#ffffff')
        minimize_btn.pack(side='left', padx=2)

        close_btn = tk.Button(controls_frame, text="✕", font=('Segoe UI', 12, 'bold'),
                            fg='#ff4757', bg='#16213e', bd=0, padx=8, pady=2,
                            command=self.close_window, cursor='hand2',
                            activebackground='#e74c3c', activeforeground='#ffffff')
        close_btn.pack(side='left', padx=2)

    def create_video_area(self, parent):
        """Create video display area with glass border"""
        video_container = self.create_glass_frame(parent, '#1a1a2e', 0.5)
        video_container.grid(row=0, column=0, sticky='nsew', padx=(0, 8))

        # Video header
        video_header = tk.Frame(video_container, bg='#1a1a2e', height=35)
        video_header.pack(fill='x')
        video_header.pack_propagate(False)

        header_label = tk.Label(video_header, text="📹 Camera Feed",
                              font=('Segoe UI', 11, 'bold'),
                              fg='#00d4ff', bg='#1a1a2e')
        header_label.pack(pady=8)

        # Video display
        self.video_label = tk.Label(video_container, bg='#000011',
                                   text="Connect to drone to see live feed\n\n🔗 Make sure Tello is:\n• Powered ON\n• WiFi mode active\n• Connected to this device",
                                   font=('Segoe UI', 12), fg='#5a6c7d',
                                   justify='center')
        self.video_label.pack(expand=True, fill='both', padx=12, pady=12)

        # Add keyboard overlay
        self.create_keyboard_overlay(video_container)

    def create_keyboard_overlay(self, parent):
        """Create WASD keyboard overlay"""
        overlay_frame = tk.Frame(parent, bg='#1a1a2e')
        overlay_frame.pack(side='bottom', anchor='e', padx=15, pady=15)

        # Create glass effect container
        keys_container = self.create_glass_frame(overlay_frame, '#0f1419', 0.7)
        keys_container.pack()

        overlay_title = tk.Label(keys_container, text="⌨️ Controls",
                               font=('Segoe UI', 9, 'bold'),
                               fg='#00d4ff', bg='#0f1419')
        overlay_title.pack(pady=(8, 4))

        # WASD layout
        keys_grid = tk.Frame(keys_container, bg='#0f1419')
        keys_grid.pack(padx=10, pady=(0, 8))

        # Key style
        key_style = {
            'font': ('Segoe UI', 10, 'bold'),
            'bg': '#16213e',
            'fg': '#ffffff',
            'relief': 'flat',
            'bd': 0,
            'width': 3,
            'height': 1,
            'cursor': 'hand2',
            'activebackground': '#00d4ff',
            'activeforeground': '#000000'
        }

        # W key (forward)
        w_key = tk.Button(keys_grid, text="W", **key_style,
                         command=lambda: self.move_drone('forward'))
        w_key.grid(row=0, column=1, padx=1, pady=1)

        # A S D keys
        a_key = tk.Button(keys_grid, text="A", **key_style,
                         command=lambda: self.move_drone('left'))
        a_key.grid(row=1, column=0, padx=1, pady=1)

        s_key = tk.Button(keys_grid, text="S", **key_style,
                         command=lambda: self.move_drone('back'))
        s_key.grid(row=1, column=1, padx=1, pady=1)

        d_key = tk.Button(keys_grid, text="D", **key_style,
                         command=lambda: self.move_drone('right'))
        d_key.grid(row=1, column=2, padx=1, pady=1)

        # Additional controls row
        controls_row = tk.Frame(keys_container, bg='#0f1419')
        controls_row.pack(pady=(0, 8))

        extra_style = {**key_style, 'width': 2, 'font': ('Segoe UI', 8, 'bold')}

        q_key = tk.Button(controls_row, text="Q↺", **extra_style,
                         command=lambda: self.move_drone('ccw'))
        q_key.pack(side='left', padx=1)

        e_key = tk.Button(controls_row, text="E↻", **extra_style,
                         command=lambda: self.move_drone('cw'))
        e_key.pack(side='left', padx=1)

        r_key = tk.Button(controls_row, text="R↑", **extra_style,
                         command=lambda: self.move_drone('up'))
        r_key.pack(side='left', padx=1)

        f_key = tk.Button(controls_row, text="F↓", **extra_style,
                         command=lambda: self.move_drone('down'))
        f_key.pack(side='left', padx=1)

    def create_glass_control_panel(self, parent):
        """Create compact control panel with glass effect"""
        control_container = self.create_glass_frame(parent, '#1a1a2e', 0.5)
        control_container.grid(row=0, column=1, sticky='ns', pady=0)

        # Panel header
        header_frame = tk.Frame(control_container, bg='#1a1a2e', height=35)
        header_frame.pack(fill='x')
        header_frame.pack_propagate(False)

        header_label = tk.Label(header_frame, text="🎮 Controls",
                              font=('Segoe UI', 11, 'bold'),
                              fg='#00d4ff', bg='#1a1a2e')
        header_label.pack(pady=8)

        # Scrollable content
        canvas = tk.Canvas(control_container, bg='#1a1a2e', highlightthickness=0, width=250)
        scrollbar = ttk.Scrollbar(control_container, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#1a1a2e')

        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )

        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True, padx=12)
        scrollbar.pack(side="right", fill="y")

        # Connection section
        self.create_connection_section(scrollable_frame)

        # Flight section
        self.create_flight_section(scrollable_frame)

        # Settings section
        self.create_settings_section(scrollable_frame)

    def create_connection_section(self, parent):
        """Create connection controls with glass effect"""
        section = self.create_glass_frame(parent, '#16213e', 0.8)
        section.pack(fill='x', pady=(0, 12), padx=8)

        section_label = tk.Label(section, text="🔗 Connection",
                               font=('Segoe UI', 10, 'bold'),
                               fg='#00d4ff', bg='#16213e')
        section_label.pack(pady=(10, 8))

        # Connection button
        self.connect_btn = tk.Button(section, text="● CONNECT",
                                   command=self.toggle_connection,
                                   font=('Segoe UI', 11, 'bold'),
                                   bg='#2ecc71', fg='white', relief='flat',
                                   bd=0, padx=20, pady=10, cursor='hand2',
                                   activebackground='#27ae60', activeforeground='white')
        self.connect_btn.pack(pady=(0, 10))

        # Emergency stop
        emergency_btn = tk.Button(section, text="🚨 EMERGENCY STOP",
                                command=self.emergency_stop,
                                font=('Segoe UI', 9, 'bold'),
                                bg='#e74c3c', fg='white', relief='flat',
                                bd=0, padx=15, pady=8, cursor='hand2',
                                activebackground='#c0392b', activeforeground='white')
        emergency_btn.pack(pady=(0, 10))

    def create_flight_section(self, parent):
        """Create flight controls with glass effect"""
        section = self.create_glass_frame(parent, '#16213e', 0.8)
        section.pack(fill='x', pady=(0, 12), padx=8)

        section_label = tk.Label(section, text="✈️ Flight Control",
                               font=('Segoe UI', 10, 'bold'),
                               fg='#00d4ff', bg='#16213e')
        section_label.pack(pady=(10, 8))

        # Flight buttons
        flight_frame = tk.Frame(section, bg='#16213e')
        flight_frame.pack(pady=(0, 10))

        self.takeoff_btn = tk.Button(flight_frame, text="🚁 TAKEOFF",
                                   command=self.takeoff,
                                   font=('Segoe UI', 10, 'bold'),
                                   bg='#3498db', fg='white', relief='flat',
                                   bd=0, padx=15, pady=8, cursor='hand2',
                                   activebackground='#2980b9', activeforeground='white')
        self.takeoff_btn.pack(side='left', padx=(0, 8))

        self.land_btn = tk.Button(flight_frame, text="🛬 LAND",
                                command=self.land,
                                font=('Segoe UI', 10, 'bold'),
                                bg='#f39c12', fg='white', relief='flat',
                                bd=0, padx=15, pady=8, cursor='hand2',
                                activebackground='#e67e22', activeforeground='white')
        self.land_btn.pack(side='right')

    def create_settings_section(self, parent):
        """Create settings with glass effect"""
        section = self.create_glass_frame(parent, '#16213e', 0.8)
        section.pack(fill='x', pady=(0, 12), padx=8)

        section_label = tk.Label(section, text="⚙️ Settings",
                               font=('Segoe UI', 10, 'bold'),
                               fg='#00d4ff', bg='#16213e')
        section_label.pack(pady=(10, 8))

        # Speed control
        speed_frame = tk.Frame(section, bg='#16213e')
        speed_frame.pack(fill='x', padx=15, pady=(0, 10))

        speed_label = tk.Label(speed_frame, text="Speed:",
                             font=('Segoe UI', 9, 'bold'),
                             fg='#ffffff', bg='#16213e')
        speed_label.pack(anchor='w')

        # Custom glass-style scale
        self.speed_var = tk.StringVar(value="50")
        speed_display = tk.Label(speed_frame, textvariable=self.speed_var,
                               font=('Segoe UI', 9, 'bold'),
                               fg='#00d4ff', bg='#16213e')
        speed_display.pack(anchor='e')

        speed_scale = tk.Scale(speed_frame, from_=10, to=100,
                             orient='horizontal', variable=self.speed,
                             command=self.update_speed_display,
                             font=('Segoe UI', 8), fg='#ffffff', bg='#2c3e50',
                             troughcolor='#34495e', activebackground='#00d4ff',
                             highlightthickness=0, length=180, width=15,
                             relief='flat', bd=0)
        speed_scale.pack(fill='x', pady=(5, 0))

        # Info section
        info_frame = tk.Frame(section, bg='#16213e')
        info_frame.pack(fill='x', padx=15, pady=(0, 10))

        info_text = tk.Label(info_frame,
                           text="💡 Tips:\n• Use WASD for movement\n• Q/E for rotation\n• R/F for up/down\n• Click keys or use keyboard",
                           font=('Segoe UI', 8),
                           fg='#95a5a6', bg='#16213e',
                           justify='left')
        info_text.pack(anchor='w')

    def update_speed_display(self, value):
        """Update speed display"""
        self.speed_var.set(f"{value}%")

    def setup_bindings(self):
        """Setup keyboard shortcuts"""
        self.root.bind('<KeyPress>', self.on_key_press)
        self.root.focus_set()

        # Bind to all frames for better keyboard capture
        def bind_recursive(widget):
            widget.bind('<Button-1>', lambda e: widget.focus_set())
            for child in widget.winfo_children():
                bind_recursive(child)

        bind_recursive(self.root)

    def on_key_press(self, event):
        """Handle keyboard shortcuts with visual feedback"""
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
        elif key == 'escape':
            self.emergency_stop()

    def minimize_window(self):
        """Minimize window"""
        self.root.iconify()

    def close_window(self):
        """Close window"""
        self.on_closing()

    def process_messages(self):
        """Process messages from background threads"""
        try:
            while True:
                msg_type, data = self.message_queue.get_nowait()

                if msg_type == 'connection_success':
                    self.on_connection_success(data)
                elif msg_type == 'connection_error':
                    self.on_connection_error(data)
                elif msg_type == 'video_frame':
                    self.update_video_display(data)
                elif msg_type == 'battery_update':
                    self.update_battery_display(data)

        except queue.Empty:
            pass

        # Schedule next check
        self.root.after(50, self.process_messages)

    def toggle_connection(self):
        """Toggle drone connection"""
        if not self.connected:
            self.connect_drone()
        else:
            self.disconnect_drone()

    def connect_drone(self):
        """Connect to drone - non-blocking"""
        def connect_thread():
            try:
                print("Connecting to DJI Tello...")
                self.tello = Tello()
                self.tello.connect()

                battery = self.tello.get_battery()
                print(f"Connected! Battery: {battery}%")

                self.message_queue.put(('connection_success', battery))

            except Exception as e:
                print(f"Connection failed: {e}")
                self.message_queue.put(('connection_error', str(e)))

        # Update UI immediately
        self.connect_btn.config(text="● CONNECTING...", bg='#f39c12', state='disabled')
        self.connection_status.config(text="● CONNECTING...", fg='#f39c12')

        # Start connection in background
        threading.Thread(target=connect_thread, daemon=True).start()

    def on_connection_success(self, battery):
        """Handle successful connection"""
        try:
            # Update battery
            self.battery_status.config(text=f"🔋 {battery}%", fg='#2ecc71')

            # Start video stream
            def start_video():
                try:
                    self.tello.streamon()
                    self.frame_read = self.tello.get_frame_read()
                    print("Video stream started")
                except Exception as e:
                    print(f"Video failed: {e}")
                    self.frame_read = None

            threading.Thread(target=start_video, daemon=True).start()

            # Update connection UI
            self.connected = True
            self.connect_btn.config(text="● DISCONNECT", bg='#e74c3c',
                                  activebackground='#c0392b', state='normal')
            self.connection_status.config(text="● ONLINE", fg='#2ecc71')

            # Start background threads
            self.running = True
            self.video_thread = threading.Thread(target=self.video_loop, daemon=True)
            self.video_thread.start()

            self.status_thread = threading.Thread(target=self.status_loop, daemon=True)
            self.status_thread.start()

            messagebox.showinfo("Success", f"Connected!\nBattery: {battery}%")

        except Exception as e:
            print(f"Connection success handler error: {e}")

    def on_connection_error(self, error_msg):
        """Handle connection error"""
        self.connect_btn.config(text="● CONNECT", bg='#2ecc71', state='normal')
        self.connection_status.config(text="● OFFLINE", fg='#ff4757')

        messagebox.showerror("Connection Failed", f"Failed to connect:\n\n{error_msg}")

    def video_loop(self):
        """Video processing loop"""
        frame_count = 0
        while self.running and self.frame_read:
            try:
                frame = self.frame_read.frame
                if frame is not None:
                    frame_count += 1

                    # Skip frames for performance
                    if frame_count % 2 != 0:
                        time.sleep(0.05)
                        continue

                    # Resize for compact display
                    height, width = frame.shape[:2]
                    max_width, max_height = 480, 320

                    if width > max_width or height > max_height:
                        ratio = min(max_width/width, max_height/height)
                        new_width = int(width * ratio)
                        new_height = int(height * ratio)
                        frame = cv2.resize(frame, (new_width, new_height))

                    # Convert and add overlay
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                    # Glass-style overlay
                    status_text = "✈️ FLYING" if self.flying else "🛬 LANDED"
                    cv2.putText(frame_rgb, status_text, (10, 25),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                               (0, 255, 255) if self.flying else (255, 255, 0), 2)

                    # Add subtle crosshair
                    h, w = frame_rgb.shape[:2]
                    center_x, center_y = w // 2, h // 2
                    cv2.circle(frame_rgb, (center_x, center_y), 5, (0, 212, 255), 1)
                    cv2.line(frame_rgb, (center_x - 10, center_y), (center_x + 10, center_y), (0, 212, 255), 1)
                    cv2.line(frame_rgb, (center_x, center_y - 10), (center_x, center_y + 10), (0, 212, 255), 1)

                    self.message_queue.put(('video_frame', frame_rgb))

                time.sleep(0.1)  # ~10 FPS

            except Exception as e:
                print(f"Video loop error: {e}")
                break

    def update_video_display(self, frame_rgb):
        """Update video display"""
        try:
            image = Image.fromarray(frame_rgb)
            photo = ImageTk.PhotoImage(image)
            self.video_label.config(image=photo, text='')
            self.video_label.image = photo
        except Exception as e:
            print(f"Video display error: {e}")

    def status_loop(self):
        """Status monitoring loop"""
        while self.connected and self.running:
            try:
                if self.tello:
                    battery = self.tello.get_battery()
                    self.message_queue.put(('battery_update', battery))

                time.sleep(5)

            except Exception as e:
                print(f"Status loop error: {e}")
                break

    def update_battery_display(self, battery):
        """Update battery display"""
        try:
            self.battery_status.config(text=f"🔋 {battery}%")

            if battery < 20:
                self.battery_status.config(fg='#e74c3c')
            elif battery < 50:
                self.battery_status.config(fg='#f39c12')
            else:
                self.battery_status.config(fg='#2ecc71')

        except Exception as e:
            print(f"Battery display error: {e}")

    def disconnect_drone(self):
        """Disconnect from drone"""
        try:
            self.running = False

            if self.flying:
                self.land()
                time.sleep(1)

            if self.tello:
                self.tello.streamoff()
                self.tello.end()

            # Update UI
            self.connected = False
            self.flying = False
            self.connect_btn.config(text="● CONNECT", bg='#2ecc71',
                                  activebackground='#27ae60', state='normal')
            self.connection_status.config(text="● OFFLINE", fg='#ff4757')
            self.battery_status.config(text="🔋 0%", fg='#747d8c')
            self.video_label.config(image='', text="Disconnected from drone")

        except Exception as e:
            print(f"Disconnect error: {e}")

    def takeoff(self):
        """Takeoff drone"""
        if not self.connected:
            messagebox.showwarning("Not Connected", "Please connect first")
            return

        if self.flying:
            messagebox.showinfo("Already Flying", "Drone is already flying")
            return

        def takeoff_thread():
            try:
                self.takeoff_btn.config(text="🚁 TAKING OFF...", state='disabled')
                self.tello.takeoff()
                self.flying = True
                self.takeoff_btn.config(text="🚁 TAKEOFF", state='normal')
                messagebox.showinfo("Success", "Takeoff successful!")
            except Exception as e:
                self.takeoff_btn.config(text="🚁 TAKEOFF", state='normal')
                messagebox.showerror("Takeoff Error", f"Failed: {str(e)}")

        threading.Thread(target=takeoff_thread, daemon=True).start()

    def land(self):
        """Land drone"""
        if not self.connected:
            return

        def land_thread():
            try:
                self.land_btn.config(text="🛬 LANDING...", state='disabled')
                self.tello.land()
                self.flying = False
                self.land_btn.config(text="🛬 LAND", state='normal')
                messagebox.showinfo("Success", "Landing successful!")
            except Exception as e:
                self.land_btn.config(text="🛬 LAND", state='normal')
                messagebox.showerror("Landing Error", f"Failed: {str(e)}")

        threading.Thread(target=land_thread, daemon=True).start()

    def move_drone(self, direction):
        """Move drone"""
        if not self.connected or not self.flying:
            return

        def move_thread():
            try:
                distance = self.speed.get()

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

        threading.Thread(target=move_thread, daemon=True).start()

    def emergency_stop(self):
        """Emergency stop"""
        if self.connected and self.tello:
            try:
                result = messagebox.askyesno("Emergency Stop",
                                           "Execute emergency stop?\nThis will cut power immediately!")
                if result:
                    self.tello.emergency()
                    self.flying = False
                    messagebox.showwarning("Emergency Stop", "Emergency stop activated!")
            except Exception as e:
                print(f"Emergency stop error: {e}")

    def run(self):
        """Run the application"""
        try:
            self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

            # Show welcome message
            messagebox.showinfo("DJI Tello Glass UI",
                               "🚁 Modern Glass Interface\n\n" +
                               "✨ Features:\n" +
                               "• Clean glass design\n" +
                               "• WASD keyboard controls\n" +
                               "• Compact laptop-friendly UI\n" +
                               "• Drag to move window\n\n" +
                               "🎮 Controls:\n" +
                               "WASD = Move • QE = Rotate • RF = Up/Down\n\n" +
                               "Connect to Tello WiFi first!")

            self.root.mainloop()

        except KeyboardInterrupt:
            self.on_closing()

    def on_closing(self):
        """Handle application closing"""
        if self.connected:
            self.disconnect_drone()
        self.root.destroy()


def main():
    """Main function"""
    print("Starting DJI Tello Glass UI Controller...")
    app = GlassTelloController()
    app.run()


if __name__ == "__main__":
    main()
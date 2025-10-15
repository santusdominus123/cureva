#!/usr/bin/env python3
"""
DJI Tello Controller - Optimized Version
Lightweight GUI dengan threading yang benar untuk mencegah freezing
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
import queue

try:
    from djitellopy import Tello
except ImportError:
    print("❌ djitellopy not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'djitellopy'])
    from djitellopy import Tello

class OptimizedTelloController:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🚁 DJI Tello Controller - Optimized")
        self.root.geometry("1000x650")  # Smaller window
        self.root.configure(bg='#0a0a0a')
        self.root.resizable(True, True)

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
        self.setup_styles()
        self.setup_ui()
        self.setup_bindings()

        # Start message processor
        self.process_messages()

    def setup_styles(self):
        """Setup custom styles"""
        style = ttk.Style()
        style.theme_use('clam')

        style.configure('Title.TLabel',
                       background='#0a0a0a',
                       foreground='#ff6b35',
                       font=('Arial', 20, 'bold'))

        style.configure('Header.TLabel',
                       background='#1a1a1a',
                       foreground='#ffffff',
                       font=('Arial', 12, 'bold'))

    def setup_ui(self):
        """Setup the optimized user interface"""
        # Configure grid weights
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
        """Create modern header"""
        header_frame = tk.Frame(self.root, bg='#1a1a1a', height=60, relief='flat', bd=0)
        header_frame.grid(row=0, column=0, columnspan=2, sticky='ew', padx=0, pady=0)
        header_frame.grid_propagate(False)

        # Title
        title_label = tk.Label(header_frame, text="🚁 DJI Tello Controller (Optimized)",
                              font=('Arial', 18, 'bold'),
                              fg='#ff6b35', bg='#1a1a1a')
        title_label.pack(side='left', padx=20, pady=15)

        # Status indicators
        self.create_status_indicators(header_frame)

    def create_status_indicators(self, parent):
        """Create status indicator badges"""
        status_frame = tk.Frame(parent, bg='#1a1a1a')
        status_frame.pack(side='right', padx=20, pady=15)

        # Connection status
        self.connection_frame = tk.Frame(status_frame, bg='#dc2626', relief='flat', bd=0)
        self.connection_frame.pack(side='left', padx=(0, 10))

        self.connection_label = tk.Label(self.connection_frame, text="❌ OFFLINE",
                                       font=('Arial', 10, 'bold'),
                                       fg='white', bg='#dc2626', padx=10, pady=4)
        self.connection_label.pack()

        # Battery status
        self.battery_frame = tk.Frame(status_frame, bg='#6b7280', relief='flat', bd=0)
        self.battery_frame.pack(side='left')

        self.battery_label = tk.Label(self.battery_frame, text="🔋 0%",
                                     font=('Arial', 10, 'bold'),
                                     fg='white', bg='#6b7280', padx=10, pady=4)
        self.battery_label.pack()

    def create_main_content(self):
        """Create main video display area"""
        video_frame = tk.Frame(self.root, bg='#000000', relief='flat', bd=2)
        video_frame.grid(row=1, column=0, sticky='nsew', padx=15, pady=15)

        # Video display
        self.video_label = tk.Label(video_frame, bg='#000000',
                                   text="Connect to drone to see camera feed\n\nMake sure your DJI Tello is:\n• Powered on\n• In WiFi mode\n• Connected to this computer",
                                   font=('Arial', 14), fg='#6b7280',
                                   justify='center')
        self.video_label.pack(expand=True, fill='both', padx=15, pady=15)

    def create_control_panel(self):
        """Create control panel"""
        control_frame = tk.Frame(self.root, bg='#1a1a1a', width=300, relief='flat', bd=0)
        control_frame.grid(row=1, column=1, sticky='ns', padx=(0, 15), pady=15)
        control_frame.grid_propagate(False)

        # Control header
        control_header = tk.Label(control_frame, text="🎮 Controls",
                                 font=('Arial', 14, 'bold'),
                                 fg='#60a5fa', bg='#1a1a1a')
        control_header.pack(pady=(0, 15))

        # Connection section
        self.create_connection_section(control_frame)

        # Flight section
        self.create_flight_section(control_frame)

        # Movement section
        self.create_movement_section(control_frame)

    def create_connection_section(self, parent):
        """Create connection controls"""
        section_frame = tk.LabelFrame(parent, text="🔗 Connection",
                                     font=('Arial', 11, 'bold'),
                                     fg='#e5e7eb', bg='#1a1a1a',
                                     relief='flat', bd=1, labelanchor='n')
        section_frame.pack(fill='x', padx=15, pady=(0, 10))

        btn_frame = tk.Frame(section_frame, bg='#1a1a1a')
        btn_frame.pack(pady=10)

        self.connect_btn = tk.Button(btn_frame, text="🟢 CONNECT",
                                    command=self.toggle_connection,
                                    font=('Arial', 11, 'bold'),
                                    bg='#10b981', fg='white', relief='flat',
                                    bd=0, padx=20, pady=8, cursor='hand2',
                                    activebackground='#059669', activeforeground='white')
        self.connect_btn.pack(side='left', padx=(0, 8))

        self.emergency_btn = tk.Button(btn_frame, text="🚨 STOP",
                                      command=self.emergency_stop,
                                      font=('Arial', 11, 'bold'),
                                      bg='#dc2626', fg='white', relief='flat',
                                      bd=0, padx=20, pady=8, cursor='hand2',
                                      activebackground='#b91c1c', activeforeground='white')
        self.emergency_btn.pack(side='right')

    def create_flight_section(self, parent):
        """Create flight controls"""
        section_frame = tk.LabelFrame(parent, text="✈️ Flight",
                                     font=('Arial', 11, 'bold'),
                                     fg='#e5e7eb', bg='#1a1a1a',
                                     relief='flat', bd=1, labelanchor='n')
        section_frame.pack(fill='x', padx=15, pady=(0, 10))

        btn_frame = tk.Frame(section_frame, bg='#1a1a1a')
        btn_frame.pack(pady=10)

        self.takeoff_btn = tk.Button(btn_frame, text="🚁 TAKEOFF",
                                    command=self.takeoff,
                                    font=('Arial', 11, 'bold'),
                                    bg='#2563eb', fg='white', relief='flat',
                                    bd=0, padx=18, pady=8, cursor='hand2',
                                    activebackground='#1d4ed8', activeforeground='white')
        self.takeoff_btn.pack(side='left', padx=(0, 8))

        self.land_btn = tk.Button(btn_frame, text="🛬 LAND",
                                 command=self.land,
                                 font=('Arial', 11, 'bold'),
                                 bg='#f59e0b', fg='white', relief='flat',
                                 bd=0, padx=18, pady=8, cursor='hand2',
                                 activebackground='#d97706', activeforeground='white')
        self.land_btn.pack(side='right')

    def create_movement_section(self, parent):
        """Create movement controls"""
        section_frame = tk.LabelFrame(parent, text="🕹️ Movement",
                                     font=('Arial', 11, 'bold'),
                                     fg='#e5e7eb', bg='#1a1a1a',
                                     relief='flat', bd=1, labelanchor='n')
        section_frame.pack(fill='x', padx=15, pady=(0, 10))

        # Speed control
        speed_frame = tk.Frame(section_frame, bg='#1a1a1a')
        speed_frame.pack(pady=10)

        speed_label = tk.Label(speed_frame, text="Speed:",
                              font=('Arial', 10, 'bold'),
                              fg='#e5e7eb', bg='#1a1a1a')
        speed_label.pack(anchor='w')

        speed_scale = tk.Scale(speed_frame, from_=10, to=100,
                              orient='horizontal', variable=self.speed,
                              font=('Arial', 8), fg='#e5e7eb', bg='#374151',
                              troughcolor='#4b5563', activebackground='#60a5fa',
                              highlightthickness=0, length=220, width=12)
        speed_scale.pack(pady=(3, 0))

        # Movement grid
        grid_frame = tk.Frame(section_frame, bg='#1a1a1a')
        grid_frame.pack(pady=10)

        # Create movement buttons
        self.create_movement_grid(grid_frame)

        # Keyboard shortcuts info
        shortcuts_frame = tk.Frame(section_frame, bg='#1a1a1a')
        shortcuts_frame.pack(pady=(5, 10))

        shortcuts_label = tk.Label(shortcuts_frame, text="⌨️ Keys: WASD=Move, QE=Rotate, RF=Up/Down",
                                  font=('Arial', 8),
                                  fg='#9ca3af', bg='#1a1a1a')
        shortcuts_label.pack()

    def create_movement_grid(self, parent):
        """Create directional movement grid"""
        # Forward
        forward_btn = tk.Button(parent, text="↑",
                               command=lambda: self.move_drone('forward'),
                               font=('Arial', 14, 'bold'), bg='#2563eb', fg='white',
                               relief='flat', bd=0, width=3, height=1, cursor='hand2',
                               activebackground='#1d4ed8', activeforeground='white')
        forward_btn.grid(row=0, column=1, padx=1, pady=1)

        # Left, Right with rotation
        left_btn = tk.Button(parent, text="←",
                            command=lambda: self.move_drone('left'),
                            font=('Arial', 14, 'bold'), bg='#2563eb', fg='white',
                            relief='flat', bd=0, width=3, height=1, cursor='hand2',
                            activebackground='#1d4ed8', activeforeground='white')
        left_btn.grid(row=1, column=0, padx=1, pady=1)

        right_btn = tk.Button(parent, text="→",
                             command=lambda: self.move_drone('right'),
                             font=('Arial', 14, 'bold'), bg='#2563eb', fg='white',
                             relief='flat', bd=0, width=3, height=1, cursor='hand2',
                             activebackground='#1d4ed8', activeforeground='white')
        right_btn.grid(row=1, column=2, padx=1, pady=1)

        # Rotation buttons
        ccw_btn = tk.Button(parent, text="↺",
                           command=lambda: self.move_drone('ccw'),
                           font=('Arial', 14, 'bold'), bg='#7c3aed', fg='white',
                           relief='flat', bd=0, width=3, height=1, cursor='hand2',
                           activebackground='#6d28d9', activeforeground='white')
        ccw_btn.grid(row=1, column=1, padx=1, pady=1)

        cw_btn = tk.Button(parent, text="↻",
                          command=lambda: self.move_drone('cw'),
                          font=('Arial', 14, 'bold'), bg='#7c3aed', fg='white',
                          relief='flat', bd=0, width=3, height=1, cursor='hand2',
                          activebackground='#6d28d9', activeforeground='white')
        cw_btn.grid(row=1, column=3, padx=1, pady=1)

        # Backward
        backward_btn = tk.Button(parent, text="↓",
                                command=lambda: self.move_drone('back'),
                                font=('Arial', 14, 'bold'), bg='#2563eb', fg='white',
                                relief='flat', bd=0, width=3, height=1, cursor='hand2',
                                activebackground='#1d4ed8', activeforeground='white')
        backward_btn.grid(row=2, column=1, padx=1, pady=1)

        # Up/Down
        up_btn = tk.Button(parent, text="⬆",
                          command=lambda: self.move_drone('up'),
                          font=('Arial', 12, 'bold'), bg='#10b981', fg='white',
                          relief='flat', bd=0, width=3, height=1, cursor='hand2',
                          activebackground='#059669', activeforeground='white')
        up_btn.grid(row=0, column=3, padx=1, pady=1)

        down_btn = tk.Button(parent, text="⬇",
                            command=lambda: self.move_drone('down'),
                            font=('Arial', 12, 'bold'), bg='#dc2626', fg='white',
                            relief='flat', bd=0, width=3, height=1, cursor='hand2',
                            activebackground='#b91c1c', activeforeground='white')
        down_btn.grid(row=2, column=3, padx=1, pady=1)

    def setup_bindings(self):
        """Setup keyboard shortcuts"""
        self.root.bind('<KeyPress>', self.on_key_press)
        self.root.focus_set()
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
        elif key == 'escape':
            self.emergency_stop()

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
                print("Attempting to connect to DJI Tello...")
                self.tello = Tello()
                self.tello.connect()

                battery = self.tello.get_battery()
                print(f"SUCCESS: Battery level: {battery}%")

                # Send success message to main thread
                self.message_queue.put(('connection_success', battery))

            except Exception as e:
                print(f"Connection failed: {e}")
                # Send error message to main thread
                self.message_queue.put(('connection_error', str(e)))

        # Update UI immediately
        self.connect_btn.config(text="Connecting...", state='disabled')
        self.connection_label.config(text="⏳ CONNECTING...")

        # Start connection in background thread
        threading.Thread(target=connect_thread, daemon=True).start()

    def on_connection_success(self, battery):
        """Handle successful connection"""
        try:
            # Update battery display
            self.battery_label.config(text=f"🔋 {battery}%")

            # Update battery color
            if battery < 20:
                bg_color = '#dc2626'
            elif battery < 50:
                bg_color = '#f59e0b'
            else:
                bg_color = '#10b981'

            self.battery_frame.config(bg=bg_color)
            self.battery_label.config(bg=bg_color)

            # Start video stream in background
            def start_video():
                try:
                    self.tello.streamon()
                    self.frame_read = self.tello.get_frame_read()
                    print("Video stream started")
                except Exception as e:
                    print(f"Video stream failed: {e}")
                    self.frame_read = None

            threading.Thread(target=start_video, daemon=True).start()

            # Update connection UI
            self.connected = True
            self.connect_btn.config(text="🔴 DISCONNECT", bg='#dc2626',
                                   activebackground='#b91c1c', state='normal')
            self.connection_frame.config(bg='#10b981')
            self.connection_label.config(text="✅ ONLINE", bg='#10b981')

            # Start background threads
            self.running = True
            self.video_thread = threading.Thread(target=self.video_loop, daemon=True)
            self.video_thread.start()

            self.status_thread = threading.Thread(target=self.status_loop, daemon=True)
            self.status_thread.start()

            messagebox.showinfo("Success", f"Connected to DJI Tello!\nBattery: {battery}%")

        except Exception as e:
            print(f"Connection success handler error: {e}")

    def on_connection_error(self, error_msg):
        """Handle connection error"""
        self.connect_btn.config(text="🟢 CONNECT", state='normal')
        self.connection_label.config(text="❌ OFFLINE")

        messagebox.showerror("Connection Failed",
                           f"Failed to connect to DJI Tello:\n\n{error_msg}")

    def video_loop(self):
        """Video processing loop - runs in background thread"""
        frame_count = 0
        while self.running and self.frame_read:
            try:
                frame = self.frame_read.frame
                if frame is not None:
                    frame_count += 1

                    # Skip frames for performance
                    if frame_count % 3 != 0:
                        time.sleep(0.05)
                        continue

                    # Resize frame
                    height, width = frame.shape[:2]
                    max_width, max_height = 500, 380

                    if width > max_width or height > max_height:
                        ratio = min(max_width/width, max_height/height)
                        new_width = int(width * ratio)
                        new_height = int(height * ratio)
                        frame = cv2.resize(frame, (new_width, new_height))

                    # Convert and send to main thread
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                    # Add simple status overlay
                    status_text = "FLYING" if self.flying else "LANDED"
                    cv2.putText(frame_rgb, status_text, (10, 25),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                               (0, 255, 0) if self.flying else (255, 255, 0), 2)

                    self.message_queue.put(('video_frame', frame_rgb))

                time.sleep(0.1)  # ~10 FPS

            except Exception as e:
                print(f"Video loop error: {e}")
                break

    def update_video_display(self, frame_rgb):
        """Update video display - runs in main thread"""
        try:
            image = Image.fromarray(frame_rgb)
            photo = ImageTk.PhotoImage(image)
            self.video_label.config(image=photo, text='')
            self.video_label.image = photo  # Keep reference
        except Exception as e:
            print(f"Video display error: {e}")

    def status_loop(self):
        """Status monitoring loop - runs in background thread"""
        while self.connected and self.running:
            try:
                if self.tello:
                    battery = self.tello.get_battery()
                    self.message_queue.put(('battery_update', battery))

                time.sleep(3)  # Update every 3 seconds

            except Exception as e:
                print(f"Status loop error: {e}")
                break

    def update_battery_display(self, battery):
        """Update battery display - runs in main thread"""
        try:
            self.battery_label.config(text=f"🔋 {battery}%")

            if battery < 20:
                bg_color = '#dc2626'
            elif battery < 50:
                bg_color = '#f59e0b'
            else:
                bg_color = '#10b981'

            self.battery_frame.config(bg=bg_color)
            self.battery_label.config(bg=bg_color)

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
            self.connect_btn.config(text="🟢 CONNECT", bg='#10b981',
                                   activebackground='#059669', state='normal')
            self.connection_frame.config(bg='#dc2626')
            self.connection_label.config(text="❌ OFFLINE", bg='#dc2626')
            self.battery_frame.config(bg='#6b7280')
            self.battery_label.config(text="🔋 0%", bg='#6b7280')
            self.video_label.config(image='', text="Disconnected from drone")

        except Exception as e:
            print(f"Disconnect error: {e}")

    def takeoff(self):
        """Takeoff drone"""
        if not self.connected:
            messagebox.showwarning("Not Connected", "Please connect to drone first")
            return

        if self.flying:
            messagebox.showinfo("Already Flying", "Drone is already in the air")
            return

        def takeoff_thread():
            try:
                self.takeoff_btn.config(text="Taking off...", state='disabled')
                self.tello.takeoff()
                self.flying = True
                self.takeoff_btn.config(text="🚁 TAKEOFF", state='normal')
                messagebox.showinfo("Success", "Drone has taken off!")
            except Exception as e:
                self.takeoff_btn.config(text="🚁 TAKEOFF", state='normal')
                messagebox.showerror("Takeoff Error", f"Failed to takeoff: {str(e)}")

        threading.Thread(target=takeoff_thread, daemon=True).start()

    def land(self):
        """Land drone"""
        if not self.connected:
            return

        def land_thread():
            try:
                self.land_btn.config(text="Landing...", state='disabled')
                self.tello.land()
                self.flying = False
                self.land_btn.config(text="🛬 LAND", state='normal')
                messagebox.showinfo("Success", "Drone has landed!")
            except Exception as e:
                self.land_btn.config(text="🛬 LAND", state='normal')
                messagebox.showerror("Landing Error", f"Failed to land: {str(e)}")

        threading.Thread(target=land_thread, daemon=True).start()

    def move_drone(self, direction):
        """Move drone in specified direction"""
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
                                           "Execute emergency stop?\n\nThis will immediately cut power!")
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

            messagebox.showinfo("Welcome",
                               "🚁 DJI Tello Controller (Optimized)\n\n" +
                               "1. Connect to Tello WiFi network\n" +
                               "2. Click CONNECT to establish connection\n" +
                               "3. Use TAKEOFF to start flying\n" +
                               "4. Control with buttons or WASD keys\n\n" +
                               "This version is optimized to prevent GUI freezing!")

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
    print("Starting Optimized DJI Tello Controller...")
    app = OptimizedTelloController()
    app.run()


if __name__ == "__main__":
    main()
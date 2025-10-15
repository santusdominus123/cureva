#!/usr/bin/env python3
"""
DJI Tello Drone with SAM Real-Time Object Tracking (Windows Compatible)
Smooth takeoff/landing, no annoying popups, optimized for Windows
"""

import sys
import cv2
import time
import threading
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk
import numpy as np
from pathlib import Path
from collections import deque
import json
from datetime import datetime

# Drone
try:
    from djitellopy import Tello
    DRONE_AVAILABLE = True
except ImportError:
    DRONE_AVAILABLE = False
    print("⚠️ djitellopy not available. Install: pip install djitellopy")

# SAM
try:
    import torch
    from segment_anything import sam_model_registry, SamPredictor
    SAM_AVAILABLE = True
except ImportError:
    SAM_AVAILABLE = False
    print("⚠️ SAM not available. Install: pip install segment-anything torch")

# Google Drive (optional)
try:
    from drone_gdrive_integration import DroneGDriveUploader
    GDRIVE_AVAILABLE = True
except:
    GDRIVE_AVAILABLE = False
    print("⚠️ Google Drive integration not available (optional)")


class DroneWindowsTracker:
    """Drone SAM tracker optimized for Windows"""

    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🚁 Drone SAM Tracker - Windows Edition")
        self.root.geometry("1600x900")
        self.root.configure(bg='#0d1117')

        # Set Windows-specific optimizations
        try:
            from ctypes import windll
            windll.shcore.SetProcessDpiAwareness(1)  # High DPI support
        except:
            pass

        # Drone
        self.tello = None
        self.frame_read = None
        self.connected = False
        self.flying = False

        # Video
        self.current_frame = None
        self.display_frame = None
        self.video_running = False
        self.fps = 0
        self.last_fps_time = time.time()
        self.frame_counter = 0

        # SAM Tracking
        self.sam = None
        self.predictor = None
        self.sam_loaded = False
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # Object Lock System
        self.tracking_active = False
        self.target_mask = None
        self.target_box = None  # (x1, y1, x2, y2)
        self.target_center = None
        self.lock_points = []  # Points clicked by user
        self.tracking_history = deque(maxlen=30)  # Track center over time

        # Auto-stabilization
        self.auto_center = tk.BooleanVar(value=False)
        self.auto_distance = tk.BooleanVar(value=False)
        self.center_threshold = 50  # pixels
        self.stabilization_speed = 20  # 0-100

        # Dataset collection
        self.collecting_dataset = False
        self.dataset_folder = "drone_dataset"
        self.capture_interval = 0.5  # seconds
        self.last_capture_time = 0
        self.frame_count = 0

        # Flight data logging
        self.flight_log = []
        self.log_enabled = tk.BooleanVar(value=True)

        # Google Drive
        self.gdrive = None
        self.gdrive_enabled = False

        # Canvas offsets for proper click handling
        self.x_offset = 0
        self.y_offset = 0
        self.scale = 1.0

        self.setup_ui()
        self.setup_bindings()

    def setup_ui(self):
        """Setup UI optimized for Windows"""
        # Top control bar
        top_bar = tk.Frame(self.root, bg='#161b22', height=90)
        top_bar.pack(fill=tk.X, side=tk.TOP)
        top_bar.pack_propagate(False)

        # Title with Windows badge
        title_frame = tk.Frame(top_bar, bg='#161b22')
        title_frame.pack(pady=15)

        title = tk.Label(title_frame, text="🚁 DRONE SAM TRACKER",
                        font=("Segoe UI", 20, "bold"), bg='#161b22', fg='#58a6ff')
        title.pack(side=tk.LEFT)

        windows_badge = tk.Label(title_frame, text=" WINDOWS ",
                                bg='#0078d4', fg='white', font=("Segoe UI", 10, "bold"),
                                padx=8, pady=3)
        windows_badge.pack(side=tk.LEFT, padx=10)

        # FPS indicator
        self.fps_label = tk.Label(title_frame, text="FPS: 0",
                                 bg='#161b22', fg='#8b949e', font=("Segoe UI", 10))
        self.fps_label.pack(side=tk.LEFT, padx=20)

        # Main content
        content = tk.Frame(self.root, bg='#0d1117')
        content.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Left: Video + Controls
        left_panel = tk.Frame(content, bg='#0d1117')
        left_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Video canvas
        video_frame = tk.Frame(left_panel, bg='#161b22', relief=tk.RAISED, bd=2)
        video_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        self.canvas = tk.Canvas(video_frame, bg='#000000', cursor="crosshair")
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.canvas.bind("<Button-1>", self.on_canvas_click)
        self.canvas.bind("<Button-3>", self.on_right_click)  # Right click to clear last point

        # Status bar below video
        status_frame = tk.Frame(left_panel, bg='#161b22', height=40)
        status_frame.pack(fill=tk.X, padx=5, pady=5)

        self.status_var = tk.StringVar(value="Ready. Connect drone and load SAM model.")
        status_label = tk.Label(status_frame, textvariable=self.status_var,
                               bg='#161b22', fg='#8b949e', font=("Segoe UI", 10))
        status_label.pack(pady=8)

        # Right: Control panel
        right_panel = tk.Frame(content, bg='#161b22', width=380)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, padx=5, pady=5)
        right_panel.pack_propagate(False)

        self.create_control_panel(right_panel)

    def create_control_panel(self, parent):
        """Create control panel"""
        # Scrollable frame
        canvas = tk.Canvas(parent, bg='#161b22', highlightthickness=0)
        scrollbar = ttk.Scrollbar(parent, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#161b22')

        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )

        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        # 1. Connection Section
        self.create_section(scrollable_frame, "🔌 CONNECTION")

        btn_connect = tk.Button(scrollable_frame, text="Connect Drone",
                               command=self.connect_drone,
                               bg='#238636', fg='white', font=("Segoe UI", 10, "bold"),
                               padx=15, pady=8, cursor="hand2", relief=tk.FLAT)
        btn_connect.pack(fill=tk.X, padx=10, pady=5)

        btn_load_sam = tk.Button(scrollable_frame, text="Load SAM Model",
                                command=self.load_sam_model,
                                bg='#1f6feb', fg='white', font=("Segoe UI", 10, "bold"),
                                padx=15, pady=8, cursor="hand2", relief=tk.FLAT)
        btn_load_sam.pack(fill=tk.X, padx=10, pady=5)

        # Connection status with battery
        status_info_frame = tk.Frame(scrollable_frame, bg='#161b22')
        status_info_frame.pack(fill=tk.X, padx=10, pady=5)

        self.conn_status = tk.Label(status_info_frame, text="❌ Disconnected",
                                    bg='#161b22', fg='#f85149', font=("Segoe UI", 9))
        self.conn_status.pack(side=tk.LEFT)

        self.battery_label = tk.Label(status_info_frame, text="",
                                      bg='#161b22', fg='#8b949e', font=("Segoe UI", 9))
        self.battery_label.pack(side=tk.RIGHT)

        # 2. Flight Control
        self.create_section(scrollable_frame, "✈️ FLIGHT CONTROL")

        flight_btns = tk.Frame(scrollable_frame, bg='#161b22')
        flight_btns.pack(fill=tk.X, padx=10, pady=5)

        self.btn_takeoff = tk.Button(flight_btns, text="🛫 Takeoff",
                               command=self.takeoff, bg='#238636', fg='white',
                               font=("Segoe UI", 10, "bold"), padx=10, pady=8,
                               cursor="hand2", relief=tk.FLAT)
        self.btn_takeoff.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)

        self.btn_land = tk.Button(flight_btns, text="🛬 Land",
                            command=self.land, bg='#da3633', fg='white',
                            font=("Segoe UI", 10, "bold"), padx=10, pady=8,
                            cursor="hand2", relief=tk.FLAT)
        self.btn_land.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)

        # Emergency stop
        btn_emergency = tk.Button(scrollable_frame, text="⚠️ EMERGENCY STOP",
                                 command=self.emergency_stop,
                                 bg='#d29922', fg='white', font=("Segoe UI", 9, "bold"),
                                 padx=15, pady=6, cursor="hand2", relief=tk.FLAT)
        btn_emergency.pack(fill=tk.X, padx=10, pady=5)

        # Flight info
        self.flight_info = tk.Label(scrollable_frame, text="Altitude: 0m | Speed: 0",
                                    bg='#161b22', fg='#8b949e', font=("Segoe UI", 8))
        self.flight_info.pack(pady=3)

        # 3. Object Tracking
        self.create_section(scrollable_frame, "🎯 OBJECT TRACKING")

        tk.Label(scrollable_frame, text="Left click: Select object | Right click: Undo",
                bg='#161b22', fg='#8b949e', font=("Segoe UI", 8)).pack(pady=3)

        track_btns = tk.Frame(scrollable_frame, bg='#161b22')
        track_btns.pack(fill=tk.X, padx=10, pady=5)

        btn_lock = tk.Button(track_btns, text="🔒 Lock",
                            command=self.lock_target,
                            bg='#1f6feb', fg='white', font=("Segoe UI", 9, "bold"),
                            padx=10, pady=6, cursor="hand2", relief=tk.FLAT)
        btn_lock.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)

        btn_unlock = tk.Button(track_btns, text="🔓 Unlock",
                              command=self.unlock_target,
                              bg='#6e7681', fg='white', font=("Segoe UI", 9, "bold"),
                              padx=10, pady=6, cursor="hand2", relief=tk.FLAT)
        btn_unlock.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)

        self.track_status = tk.Label(scrollable_frame, text="⚪ No target locked",
                                     bg='#161b22', fg='#8b949e', font=("Segoe UI", 9, "bold"))
        self.track_status.pack(pady=5)

        # Points counter
        self.points_label = tk.Label(scrollable_frame, text="Points: 0",
                                     bg='#161b22', fg='#8b949e', font=("Segoe UI", 8))
        self.points_label.pack(pady=2)

        # 4. Auto Stabilization
        self.create_section(scrollable_frame, "⚖️ AUTO STABILIZATION")

        cb_center = tk.Checkbutton(scrollable_frame, text="Auto-center on target",
                                   variable=self.auto_center, bg='#161b22', fg='#c9d1d9',
                                   selectcolor='#0d1117', font=("Segoe UI", 9),
                                   activebackground='#161b22', cursor="hand2")
        cb_center.pack(anchor=tk.W, padx=15, pady=3)

        # Stabilization speed slider
        speed_frame = tk.Frame(scrollable_frame, bg='#161b22')
        speed_frame.pack(fill=tk.X, padx=15, pady=5)

        tk.Label(speed_frame, text="Speed:", bg='#161b22', fg='#8b949e',
                font=("Segoe UI", 8)).pack(side=tk.LEFT)

        self.speed_scale = tk.Scale(speed_frame, from_=10, to=50, orient=tk.HORIZONTAL,
                                    bg='#161b22', fg='#c9d1d9', highlightthickness=0,
                                    troughcolor='#0d1117', activebackground='#1f6feb',
                                    length=200, cursor="hand2")
        self.speed_scale.set(20)
        self.speed_scale.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)

        # 5. Dataset Collection
        self.create_section(scrollable_frame, "📸 DATASET COLLECTION")

        dataset_btns = tk.Frame(scrollable_frame, bg='#161b22')
        dataset_btns.pack(fill=tk.X, padx=10, pady=5)

        btn_start_collect = tk.Button(dataset_btns, text="▶️ Start",
                                     command=self.start_dataset_collection,
                                     bg='#238636', fg='white', font=("Segoe UI", 9, "bold"),
                                     padx=10, pady=6, cursor="hand2", relief=tk.FLAT)
        btn_start_collect.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)

        btn_stop_collect = tk.Button(dataset_btns, text="⏹️ Stop",
                                    command=self.stop_dataset_collection,
                                    bg='#da3633', fg='white', font=("Segoe UI", 9, "bold"),
                                    padx=10, pady=6, cursor="hand2", relief=tk.FLAT)
        btn_stop_collect.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)

        # Dataset info
        dataset_info_frame = tk.Frame(scrollable_frame, bg='#161b22')
        dataset_info_frame.pack(fill=tk.X, padx=10, pady=5)

        self.collect_status = tk.Label(dataset_info_frame, text="Frames: 0",
                                       bg='#161b22', fg='#8b949e', font=("Segoe UI", 9))
        self.collect_status.pack(side=tk.LEFT)

        btn_open_folder = tk.Button(dataset_info_frame, text="📁 Open",
                                    command=self.open_dataset_folder,
                                    bg='#6e7681', fg='white', font=("Segoe UI", 7, "bold"),
                                    padx=8, pady=3, cursor="hand2", relief=tk.FLAT)
        btn_open_folder.pack(side=tk.RIGHT)

        # Capture interval
        interval_frame = tk.Frame(scrollable_frame, bg='#161b22')
        interval_frame.pack(fill=tk.X, padx=15, pady=3)

        tk.Label(interval_frame, text="Interval (s):", bg='#161b22', fg='#8b949e',
                font=("Segoe UI", 8)).pack(side=tk.LEFT)

        self.interval_var = tk.StringVar(value="0.5")
        interval_entry = tk.Entry(interval_frame, textvariable=self.interval_var,
                                 bg='#0d1117', fg='#c9d1d9', font=("Segoe UI", 8),
                                 width=8, relief=tk.FLAT)
        interval_entry.pack(side=tk.LEFT, padx=5)

        # 6. Google Drive Sync (if available)
        if GDRIVE_AVAILABLE:
            self.create_section(scrollable_frame, "☁️ GOOGLE DRIVE")

            gdrive_btns = tk.Frame(scrollable_frame, bg='#161b22')
            gdrive_btns.pack(fill=tk.X, padx=10, pady=5)

            btn_gdrive = tk.Button(gdrive_btns, text="Connect",
                                  command=self.connect_gdrive,
                                  bg='#1f6feb', fg='white', font=("Segoe UI", 8, "bold"),
                                  padx=10, pady=4, cursor="hand2", relief=tk.FLAT)
            btn_gdrive.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)

            btn_upload = tk.Button(gdrive_btns, text="Upload",
                                   command=self.upload_to_gdrive,
                                   bg='#238636', fg='white', font=("Segoe UI", 8, "bold"),
                                   padx=10, pady=4, cursor="hand2", relief=tk.FLAT)
            btn_upload.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)

            self.gdrive_status = tk.Label(scrollable_frame, text="❌ Not connected",
                                          bg='#161b22', fg='#8b949e', font=("Segoe UI", 8))
            self.gdrive_status.pack(pady=3)

        # 7. System Info
        self.create_section(scrollable_frame, "ℹ️ SYSTEM INFO")

        self.info_text = tk.Text(scrollable_frame, height=10, width=40,
                                bg='#0d1117', fg='#8b949e', font=("Consolas", 8),
                                relief=tk.FLAT, padx=5, pady=5, wrap=tk.WORD)
        self.info_text.pack(fill=tk.X, padx=10, pady=5)

        # 8. Quick Help
        self.create_section(scrollable_frame, "⌨️ KEYBOARD SHORTCUTS")

        help_text = """
SPACE - Takeoff / Land
L - Lock target
U - Unlock target
C - Start collecting
S - Stop collecting
R - Reset points
E - Emergency stop
"""
        tk.Label(scrollable_frame, text=help_text, justify=tk.LEFT,
                bg='#161b22', fg='#8b949e', font=("Consolas", 8)).pack(padx=10, pady=5)

        # Update info periodically
        self.update_info()

    def create_section(self, parent, title):
        """Create section header"""
        frame = tk.Frame(parent, bg='#21262d', height=32)
        frame.pack(fill=tk.X, padx=5, pady=(10, 5))
        frame.pack_propagate(False)

        label = tk.Label(frame, text=title, bg='#21262d', fg='#c9d1d9',
                        font=("Segoe UI", 10, "bold"))
        label.pack(anchor=tk.W, padx=10, pady=6)

    def setup_bindings(self):
        """Setup keyboard bindings"""
        self.root.bind("<space>", lambda e: self.takeoff() if not self.flying else self.land())
        self.root.bind("l", lambda e: self.lock_target())
        self.root.bind("u", lambda e: self.unlock_target())
        self.root.bind("c", lambda e: self.start_dataset_collection())
        self.root.bind("s", lambda e: self.stop_dataset_collection())
        self.root.bind("r", lambda e: self.clear_points())
        self.root.bind("e", lambda e: self.emergency_stop())

    def connect_drone(self):
        """Connect to drone"""
        if not DRONE_AVAILABLE:
            self.status_var.set("❌ djitellopy not installed!")
            return

        try:
            self.status_var.set("Connecting to drone...")
            self.root.update()

            self.tello = Tello()
            self.tello.connect()

            battery = self.tello.get_battery()
            self.tello.streamon()
            self.frame_read = self.tello.get_frame_read()

            self.connected = True
            self.conn_status.config(text="✅ Connected", fg='#3fb950')
            self.battery_label.config(text=f"🔋 {battery}%")
            self.status_var.set(f"✅ Connected! Battery: {battery}%")

            # Start video thread
            self.video_running = True
            threading.Thread(target=self.video_loop, daemon=True).start()

            # Start telemetry update
            threading.Thread(target=self.update_telemetry, daemon=True).start()

        except Exception as e:
            self.status_var.set(f"❌ Connection failed: {str(e)}")
            self.conn_status.config(text="❌ Failed", fg='#f85149')

    def load_sam_model(self):
        """Load SAM model"""
        if not SAM_AVAILABLE:
            self.status_var.set("❌ SAM not installed!")
            return

        checkpoint = filedialog.askopenfilename(
            title="Select SAM Checkpoint (.pth)",
            filetypes=[("PyTorch Model", "*.pth"), ("All files", "*.*")]
        )

        if not checkpoint:
            return

        model_window = tk.Toplevel(self.root)
        model_window.title("Select Model Type")
        model_window.geometry("320x220")
        model_window.configure(bg='#0d1117')
        model_window.transient(self.root)
        model_window.grab_set()

        # Center window
        model_window.update_idletasks()
        x = (model_window.winfo_screenwidth() // 2) - (320 // 2)
        y = (model_window.winfo_screenheight() // 2) - (220 // 2)
        model_window.geometry(f'+{x}+{y}')

        tk.Label(model_window, text="Select SAM Model Type:",
                bg='#0d1117', fg='#c9d1d9', font=("Segoe UI", 12, "bold")).pack(pady=20)

        model_var = tk.StringVar(value="vit_h")

        for model_type, label in [("vit_h", "ViT-H (Best Quality)"),
                                   ("vit_l", "ViT-L (Balanced)"),
                                   ("vit_b", "ViT-B (Fastest)")]:
            tk.Radiobutton(model_window, text=label, variable=model_var, value=model_type,
                          bg='#0d1117', fg='#c9d1d9', selectcolor='#0d1117',
                          font=("Segoe UI", 10), cursor="hand2",
                          activebackground='#0d1117').pack(anchor=tk.W, padx=30, pady=3)

        def load():
            model_window.destroy()
            self.status_var.set("Loading SAM model...")
            self.root.update()

            def load_thread():
                try:
                    self.sam = sam_model_registry[model_var.get()](checkpoint=checkpoint)
                    self.sam = self.sam.to(self.device)
                    self.predictor = SamPredictor(self.sam)
                    self.sam_loaded = True
                    self.status_var.set(f"✅ SAM loaded ({model_var.get()}, {self.device})")
                except Exception as e:
                    self.status_var.set(f"❌ SAM load failed: {str(e)}")

            threading.Thread(target=load_thread, daemon=True).start()

        tk.Button(model_window, text="Load Model", command=load,
                 bg='#238636', fg='white', font=("Segoe UI", 11, "bold"),
                 padx=30, pady=10, cursor="hand2", relief=tk.FLAT).pack(pady=20)

    def video_loop(self):
        """Main video processing loop"""
        while self.video_running and self.connected:
            try:
                if self.frame_read:
                    frame = self.frame_read.frame
                    self.current_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                    # Process tracking
                    if self.tracking_active and self.sam_loaded:
                        self.process_tracking()

                    # Collect dataset
                    if self.collecting_dataset:
                        self.capture_dataset_frame()

                    # Update display
                    self.update_video_display()

                    # Calculate FPS
                    self.frame_counter += 1
                    if time.time() - self.last_fps_time >= 1.0:
                        self.fps = self.frame_counter
                        self.fps_label.config(text=f"FPS: {self.fps}")
                        self.frame_counter = 0
                        self.last_fps_time = time.time()

                time.sleep(0.03)  # ~30 FPS

            except Exception as e:
                print(f"Video loop error: {e}")
                time.sleep(0.1)

    def on_canvas_click(self, event):
        """Handle canvas click"""
        if not self.sam_loaded or self.current_frame is None:
            self.status_var.set("⚠️ Load SAM model and connect drone first!")
            return

        canvas_w = self.canvas.winfo_width()
        canvas_h = self.canvas.winfo_height()

        if self.current_frame is not None:
            img_h, img_w = self.current_frame.shape[:2]
            scale = min(canvas_w / img_w, canvas_h / img_h)

            new_w = int(img_w * scale)
            new_h = int(img_h * scale)

            x_offset = (canvas_w - new_w) // 2
            y_offset = (canvas_h - new_h) // 2

            click_x = event.x - x_offset
            click_y = event.y - y_offset

            if 0 <= click_x < new_w and 0 <= click_y < new_h:
                orig_x = int(click_x / scale)
                orig_y = int(click_y / scale)

                self.lock_points.append((orig_x, orig_y))
                self.points_label.config(text=f"Points: {len(self.lock_points)}")
                self.status_var.set(f"✅ Point {len(self.lock_points)} added. Click 'Lock' to segment.")

    def on_right_click(self, event):
        """Right click to remove last point"""
        if len(self.lock_points) > 0:
            self.lock_points.pop()
            self.points_label.config(text=f"Points: {len(self.lock_points)}")
            self.status_var.set(f"Removed last point. Points: {len(self.lock_points)}")

    def clear_points(self):
        """Clear all points"""
        self.lock_points = []
        self.points_label.config(text="Points: 0")
        self.status_var.set("Points cleared")

    def lock_target(self):
        """Lock target using SAM"""
        if not self.sam_loaded:
            self.status_var.set("⚠️ Load SAM model first!")
            return

        if len(self.lock_points) == 0:
            self.status_var.set("⚠️ Click on object first!")
            return

        if self.current_frame is None:
            return

        self.status_var.set("🔄 Segmenting target...")
        self.root.update()

        def segment():
            try:
                self.predictor.set_image(self.current_frame)

                points = np.array(self.lock_points)
                labels = np.ones(len(points))

                masks, scores, _ = self.predictor.predict(
                    point_coords=points,
                    point_labels=labels,
                    multimask_output=True
                )

                best_idx = np.argmax(scores)
                self.target_mask = masks[best_idx]

                # Calculate bounding box
                ys, xs = np.where(self.target_mask)
                if len(xs) > 0 and len(ys) > 0:
                    x1, x2 = xs.min(), xs.max()
                    y1, y2 = ys.min(), ys.max()
                    self.target_box = (x1, y1, x2, y2)
                    self.target_center = ((x1 + x2) // 2, (y1 + y2) // 2)

                    self.tracking_active = True
                    self.track_status.config(text="🟢 Target locked!", fg='#3fb950')
                    self.status_var.set(f"✅ Target locked! Score: {scores[best_idx]:.3f}")

                    # Log event
                    if self.log_enabled.get():
                        self.log_event("target_locked", {"score": float(scores[best_idx]),
                                                         "points": len(self.lock_points)})

            except Exception as e:
                self.status_var.set(f"❌ Segmentation failed: {str(e)}")

        threading.Thread(target=segment, daemon=True).start()

    def unlock_target(self):
        """Unlock target"""
        self.tracking_active = False
        self.target_mask = None
        self.target_box = None
        self.target_center = None
        self.lock_points = []
        self.tracking_history.clear()

        self.track_status.config(text="⚪ No target locked", fg='#8b949e')
        self.points_label.config(text="Points: 0")
        self.status_var.set("Target unlocked")

        if self.log_enabled.get():
            self.log_event("target_unlocked", {})

    def process_tracking(self):
        """Process object tracking"""
        if self.target_mask is None or self.current_frame is None:
            return

        try:
            if self.target_box:
                self.predictor.set_image(self.current_frame)

                x1, y1, x2, y2 = self.target_box
                box = np.array([[x1, y1, x2, y2]], dtype=np.float32)

                masks, scores, _ = self.predictor.predict(
                    box=box,
                    multimask_output=False
                )

                self.target_mask = masks[0]

                # Update box and center
                ys, xs = np.where(self.target_mask)
                if len(xs) > 0 and len(ys) > 0:
                    x1, x2 = xs.min(), xs.max()
                    y1, y2 = ys.min(), ys.max()
                    self.target_box = (x1, y1, x2, y2)
                    self.target_center = ((x1 + x2) // 2, (y1 + y2) // 2)

                    self.tracking_history.append(self.target_center)

                    # Auto-stabilization
                    if self.auto_center.get() and self.flying:
                        self.auto_center_drone()

        except Exception as e:
            print(f"Tracking error: {e}")

    def auto_center_drone(self):
        """Auto-center drone on target"""
        if not self.target_center or not self.current_frame:
            return

        img_h, img_w = self.current_frame.shape[:2]
        cx, cy = self.target_center

        offset_x = cx - img_w // 2
        offset_y = cy - img_h // 2

        threshold = self.center_threshold
        speed = self.speed_scale.get()

        try:
            if abs(offset_x) > threshold or abs(offset_y) > threshold:
                vel_x = int(np.clip(offset_x / 10, -speed, speed)) if abs(offset_x) > threshold else 0
                vel_y = int(np.clip(-offset_y / 10, -speed, speed)) if abs(offset_y) > threshold else 0

                self.tello.send_rc_control(vel_x, 0, vel_y, 0)

        except Exception as e:
            print(f"Auto-center error: {e}")

    def update_video_display(self):
        """Update video display"""
        if self.current_frame is None:
            return

        display = self.current_frame.copy()

        # Draw overlays
        if self.tracking_active and self.target_mask is not None:
            overlay = np.zeros_like(display)
            overlay[self.target_mask] = [0, 255, 0]
            display = cv2.addWeighted(display, 0.7, overlay, 0.3, 0)

            if self.target_box:
                x1, y1, x2, y2 = self.target_box
                cv2.rectangle(display, (x1, y1), (x2, y2), (0, 255, 255), 3)
                # Draw label
                cv2.putText(display, "TARGET", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX,
                           0.6, (0, 255, 255), 2)

            if self.target_center:
                cx, cy = self.target_center
                cv2.circle(display, (cx, cy), 10, (255, 0, 0), -1)
                cv2.circle(display, (cx, cy), 14, (255, 255, 255), 2)

            if len(self.tracking_history) > 1:
                points = list(self.tracking_history)
                for i in range(len(points) - 1):
                    cv2.line(display, points[i], points[i+1], (255, 255, 0), 2)

        # Draw lock points
        for i, (px, py) in enumerate(self.lock_points):
            cv2.circle(display, (px, py), 6, (0, 255, 0), -1)
            cv2.circle(display, (px, py), 8, (255, 255, 255), 2)
            cv2.putText(display, str(i+1), (px+12, py+5), cv2.FONT_HERSHEY_SIMPLEX,
                       0.5, (255, 255, 255), 1)

        # Draw crosshair
        h, w = display.shape[:2]
        cv2.line(display, (w//2 - 25, h//2), (w//2 + 25, h//2), (255, 255, 255), 1)
        cv2.line(display, (w//2, h//2 - 25), (w//2, h//2 + 25), (255, 255, 255), 1)

        # Draw status overlay
        status_texts = []
        if self.tracking_active:
            status_texts.append("TRACKING: ON")
        if self.collecting_dataset:
            status_texts.append(f"RECORDING: {self.frame_count} frames")
        if self.auto_center.get():
            status_texts.append("AUTO-CENTER: ON")

        for i, text in enumerate(status_texts):
            y = 30 + i * 25
            cv2.rectangle(display, (10, y-20), (10+len(text)*9, y+5), (0, 0, 0), -1)
            cv2.putText(display, text, (15, y), cv2.FONT_HERSHEY_SIMPLEX,
                       0.5, (0, 255, 0), 1, cv2.LINE_AA)

        # Convert and display
        img = Image.fromarray(display)

        canvas_w = self.canvas.winfo_width()
        canvas_h = self.canvas.winfo_height()

        scale = min(canvas_w / w, canvas_h / h, 1.0)
        self.scale = scale

        new_w = int(w * scale)
        new_h = int(h * scale)

        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        photo = ImageTk.PhotoImage(img)

        self.x_offset = (canvas_w - new_w) // 2
        self.y_offset = (canvas_h - new_h) // 2

        self.canvas.delete("all")
        self.canvas.create_image(self.x_offset, self.y_offset, anchor=tk.NW, image=photo)
        self.canvas.image = photo

    def start_dataset_collection(self):
        """Start collecting dataset"""
        if not self.tracking_active:
            self.status_var.set("⚠️ Lock a target first!")
            return

        try:
            self.capture_interval = float(self.interval_var.get())
        except:
            self.capture_interval = 0.5

        Path(self.dataset_folder).mkdir(exist_ok=True)
        self.collecting_dataset = True
        self.frame_count = 0
        self.last_capture_time = time.time()

        self.status_var.set("📸 Collecting dataset...")

        if self.log_enabled.get():
            self.log_event("dataset_start", {"interval": self.capture_interval})

    def stop_dataset_collection(self):
        """Stop collecting dataset"""
        self.collecting_dataset = False
        self.status_var.set(f"✅ Saved {self.frame_count} frames to {self.dataset_folder}")

        if self.log_enabled.get():
            self.log_event("dataset_stop", {"frames": self.frame_count})

        # Save log
        self.save_flight_log()

    def capture_dataset_frame(self):
        """Capture frame for dataset"""
        current_time = time.time()

        if current_time - self.last_capture_time >= self.capture_interval:
            if self.current_frame is not None and self.target_mask is not None:
                # Save frame
                frame_path = Path(self.dataset_folder) / f"frame_{self.frame_count:05d}.jpg"
                cv2.imwrite(str(frame_path), cv2.cvtColor(self.current_frame, cv2.COLOR_RGB2BGR))

                # Save mask
                mask_path = Path(self.dataset_folder) / f"mask_{self.frame_count:05d}.png"
                cv2.imwrite(str(mask_path), (self.target_mask * 255).astype(np.uint8))

                # Save metadata
                if self.target_box:
                    meta_path = Path(self.dataset_folder) / f"meta_{self.frame_count:05d}.txt"
                    with open(meta_path, 'w') as f:
                        x1, y1, x2, y2 = self.target_box
                        cx, cy = self.target_center if self.target_center else (0, 0)
                        f.write(f"box: {x1},{y1},{x2},{y2}\n")
                        f.write(f"center: {cx},{cy}\n")
                        f.write(f"timestamp: {datetime.now().isoformat()}\n")

                self.frame_count += 1
                self.collect_status.config(text=f"Frames: {self.frame_count}")
                self.last_capture_time = current_time

    def open_dataset_folder(self):
        """Open dataset folder in Windows Explorer"""
        import os
        import subprocess
        folder = Path(self.dataset_folder).absolute()
        folder.mkdir(exist_ok=True)
        subprocess.Popen(f'explorer "{folder}"')

    def connect_gdrive(self):
        """Connect to Google Drive"""
        if not GDRIVE_AVAILABLE:
            self.status_var.set("⚠️ Google Drive not available")
            return

        try:
            self.gdrive = DroneGDriveUploader()
            if self.gdrive.authenticate():
                self.gdrive.ensure_folder("drone_sam_dataset")
                self.gdrive_enabled = True
                self.gdrive_status.config(text="✅ Connected", fg='#3fb950')
                self.status_var.set("✅ Google Drive connected")
        except Exception as e:
            self.status_var.set(f"❌ Google Drive failed: {str(e)}")

    def upload_to_gdrive(self):
        """Upload dataset to Google Drive"""
        if not self.gdrive_enabled:
            self.status_var.set("⚠️ Connect Google Drive first!")
            return

        self.status_var.set("☁️ Uploading to Google Drive...")
        # TODO: Implement batch upload
        pass

    def update_telemetry(self):
        """Update drone telemetry"""
        while self.connected:
            try:
                if self.tello:
                    battery = self.tello.get_battery()
                    self.battery_label.config(text=f"🔋 {battery}%")

                    if self.flying:
                        try:
                            alt = self.tello.get_height()
                            speed = self.tello.get_speed_x()
                            self.flight_info.config(text=f"Alt: {alt}cm | Speed: {speed}")
                        except:
                            pass

                time.sleep(2)

            except:
                time.sleep(1)

    def takeoff(self):
        """Takeoff drone smoothly - NO POPUPS"""
        if not self.connected:
            self.status_var.set("❌ Not connected to drone")
            return

        if self.flying:
            self.status_var.set("⚠️ Already flying")
            return

        try:
            self.status_var.set("🛫 Taking off...")
            self.btn_takeoff.config(state=tk.DISABLED)
            self.root.update()

            # Smooth takeoff
            self.tello.takeoff()
            time.sleep(0.5)  # Stabilization

            self.flying = True
            self.btn_takeoff.config(state=tk.NORMAL)
            self.status_var.set("✅ Flying - Ready to track")

            if self.log_enabled.get():
                self.log_event("takeoff", {})

        except Exception as e:
            self.flying = False
            self.btn_takeoff.config(state=tk.NORMAL)
            self.status_var.set(f"❌ Takeoff failed: {str(e)}")
            print(f"Takeoff error: {e}")

    def land(self):
        """Land drone smoothly - NO POPUPS"""
        if not self.connected:
            return

        if not self.flying:
            self.status_var.set("⚠️ Already on ground")
            return

        try:
            self.status_var.set("🛬 Landing...")
            self.btn_land.config(state=tk.DISABLED)
            self.root.update()

            # Stop movement
            if self.tello:
                self.tello.send_rc_control(0, 0, 0, 0)
                time.sleep(0.3)

            # Land
            self.tello.land()
            time.sleep(0.5)

            self.flying = False
            self.tracking_active = False
            self.btn_land.config(state=tk.NORMAL)
            self.status_var.set("✅ Landed safely")

            if self.log_enabled.get():
                self.log_event("land", {})

        except Exception as e:
            self.btn_land.config(state=tk.NORMAL)
            self.status_var.set(f"❌ Landing failed: {str(e)}")
            print(f"Landing error: {e}")

    def emergency_stop(self):
        """Emergency stop"""
        if self.connected and self.tello:
            try:
                self.tello.emergency()
                self.flying = False
                self.tracking_active = False
                self.status_var.set("⚠️ EMERGENCY STOP ACTIVATED")
                if self.log_enabled.get():
                    self.log_event("emergency_stop", {})
            except Exception as e:
                print(f"Emergency stop error: {e}")

    def log_event(self, event_type, data):
        """Log flight event"""
        self.flight_log.append({
            "timestamp": datetime.now().isoformat(),
            "event": event_type,
            "data": data
        })

    def save_flight_log(self):
        """Save flight log to file"""
        if len(self.flight_log) > 0:
            log_path = Path(self.dataset_folder) / f"flight_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(log_path, 'w') as f:
                json.dump(self.flight_log, f, indent=2)
            print(f"Flight log saved: {log_path}")

    def update_info(self):
        """Update info panel"""
        info = f"""System Status:
━━━━━━━━━━━━━━━━━━━━━
Drone: {'✅ Connected' if self.connected else '❌ Disconnected'}
SAM: {'✅ Loaded' if self.sam_loaded else '❌ Not loaded'}
Device: {self.device}

Tracking:
Status: {'🟢 Active' if self.tracking_active else '⚪ Inactive'}
Points: {len(self.lock_points)}
History: {len(self.tracking_history)}

Dataset:
Recording: {'✅ Yes' if self.collecting_dataset else '❌ No'}
Frames: {self.frame_count}
Folder: {self.dataset_folder}

Performance:
FPS: {self.fps}
"""
        self.info_text.delete(1.0, tk.END)
        self.info_text.insert(1.0, info)

        self.root.after(1000, self.update_info)

    def run(self):
        """Run application"""
        self.root.mainloop()

        # Cleanup
        self.video_running = False
        if self.connected and self.tello:
            try:
                if self.flying:
                    self.tello.land()
                self.tello.streamoff()
            except:
                pass

        # Save log on exit
        if len(self.flight_log) > 0:
            self.save_flight_log()


def main():
    print("=" * 60)
    print("🚁 DRONE SAM TRACKER - WINDOWS EDITION")
    print("=" * 60)
    print()

    if DRONE_AVAILABLE:
        print("✅ Drone library available (djitellopy)")
    else:
        print("❌ Drone library NOT available")
        print("   Install: pip install djitellopy")

    if SAM_AVAILABLE:
        print("✅ SAM available (segment-anything)")
    else:
        print("❌ SAM NOT available")
        print("   Install: pip install segment-anything torch")

    if GDRIVE_AVAILABLE:
        print("✅ Google Drive integration available")
    else:
        print("⚠️  Google Drive integration NOT available (optional)")

    print()
    print("=" * 60)
    print("Starting application...")
    print("=" * 60)

    app = DroneWindowsTracker()
    app.run()


if __name__ == "__main__":
    main()

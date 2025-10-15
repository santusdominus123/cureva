#!/usr/bin/env python3
"""
DJI Tello Drone with SAM Real-Time Object Tracking
Lock objects while flying for stable dataset collection
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

# Google Drive
try:
    from drone_gdrive_integration import DroneGDriveUploader
    GDRIVE_AVAILABLE = True
except:
    GDRIVE_AVAILABLE = False

class DroneObjectTracker:
    """Real-time object tracking with SAM for stable dataset collection"""

    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🚁 Drone SAM Object Tracker")
        self.root.geometry("1600x900")
        self.root.configure(bg='#0d1117')

        # Drone
        self.tello = None
        self.frame_read = None
        self.connected = False
        self.flying = False

        # Video
        self.current_frame = None
        self.display_frame = None
        self.video_running = False

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
        self.target_distance = 100  # cm

        # Dataset collection
        self.collecting_dataset = False
        self.dataset_folder = "drone_dataset"
        self.capture_interval = 0.5  # seconds
        self.last_capture_time = 0
        self.frame_count = 0

        # Google Drive
        self.gdrive = None
        self.gdrive_enabled = False

        self.setup_ui()
        self.setup_bindings()

    def setup_ui(self):
        """Setup UI"""
        # Top control bar
        top_bar = tk.Frame(self.root, bg='#161b22', height=80)
        top_bar.pack(fill=tk.X, side=tk.TOP)
        top_bar.pack_propagate(False)

        # Title
        title = tk.Label(top_bar, text="🚁 DRONE SAM OBJECT TRACKER",
                        font=("Arial", 20, "bold"), bg='#161b22', fg='#58a6ff')
        title.pack(pady=15)

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

        # Status bar below video
        status_frame = tk.Frame(left_panel, bg='#161b22', height=40)
        status_frame.pack(fill=tk.X, padx=5, pady=5)

        self.status_var = tk.StringVar(value="Ready. Connect drone and load SAM model.")
        status_label = tk.Label(status_frame, textvariable=self.status_var,
                               bg='#161b22', fg='#8b949e', font=("Arial", 10))
        status_label.pack(pady=8)

        # Right: Control panel
        right_panel = tk.Frame(content, bg='#161b22', width=350)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, padx=5, pady=5)
        right_panel.pack_propagate(False)

        self.create_control_panel(right_panel)

    def create_control_panel(self, parent):
        """Create right control panel"""
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
                               bg='#238636', fg='white', font=("Arial", 10, "bold"),
                               padx=15, pady=8, cursor="hand2")
        btn_connect.pack(fill=tk.X, padx=10, pady=5)

        btn_load_sam = tk.Button(scrollable_frame, text="Load SAM Model",
                                command=self.load_sam_model,
                                bg='#1f6feb', fg='white', font=("Arial", 10, "bold"),
                                padx=15, pady=8, cursor="hand2")
        btn_load_sam.pack(fill=tk.X, padx=10, pady=5)

        self.conn_status = tk.Label(scrollable_frame, text="❌ Disconnected",
                                    bg='#161b22', fg='#f85149', font=("Arial", 9))
        self.conn_status.pack(pady=5)

        # 2. Flight Control
        self.create_section(scrollable_frame, "✈️ FLIGHT CONTROL")

        flight_btns = tk.Frame(scrollable_frame, bg='#161b22')
        flight_btns.pack(fill=tk.X, padx=10, pady=5)

        btn_takeoff = tk.Button(flight_btns, text="🛫 Takeoff",
                               command=self.takeoff, bg='#238636', fg='white',
                               font=("Arial", 9, "bold"), padx=10, pady=6)
        btn_takeoff.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)

        btn_land = tk.Button(flight_btns, text="🛬 Land",
                            command=self.land, bg='#da3633', fg='white',
                            font=("Arial", 9, "bold"), padx=10, pady=6)
        btn_land.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)

        # 3. Object Tracking
        self.create_section(scrollable_frame, "🎯 OBJECT TRACKING")

        tk.Label(scrollable_frame, text="Click on video to select object",
                bg='#161b22', fg='#8b949e', font=("Arial", 9)).pack(pady=5)

        btn_lock = tk.Button(scrollable_frame, text="🔒 Lock Target",
                            command=self.lock_target,
                            bg='#1f6feb', fg='white', font=("Arial", 10, "bold"),
                            padx=15, pady=8, cursor="hand2")
        btn_lock.pack(fill=tk.X, padx=10, pady=5)

        btn_unlock = tk.Button(scrollable_frame, text="🔓 Unlock Target",
                              command=self.unlock_target,
                              bg='#6e7681', fg='white', font=("Arial", 10, "bold"),
                              padx=15, pady=8, cursor="hand2")
        btn_unlock.pack(fill=tk.X, padx=10, pady=5)

        self.track_status = tk.Label(scrollable_frame, text="⚪ No target locked",
                                     bg='#161b22', fg='#8b949e', font=("Arial", 9, "bold"))
        self.track_status.pack(pady=5)

        # 4. Auto Stabilization
        self.create_section(scrollable_frame, "⚖️ AUTO STABILIZATION")

        cb_center = tk.Checkbutton(scrollable_frame, text="Auto-center on target",
                                   variable=self.auto_center, bg='#161b22', fg='#c9d1d9',
                                   selectcolor='#0d1117', font=("Arial", 9),
                                   activebackground='#161b22')
        cb_center.pack(anchor=tk.W, padx=15, pady=3)

        cb_distance = tk.Checkbutton(scrollable_frame, text="Maintain distance",
                                     variable=self.auto_distance, bg='#161b22', fg='#c9d1d9',
                                     selectcolor='#0d1117', font=("Arial", 9),
                                     activebackground='#161b22')
        cb_distance.pack(anchor=tk.W, padx=15, pady=3)

        # 5. Dataset Collection
        self.create_section(scrollable_frame, "📸 DATASET COLLECTION")

        btn_start_collect = tk.Button(scrollable_frame, text="▶️ Start Collecting",
                                     command=self.start_dataset_collection,
                                     bg='#238636', fg='white', font=("Arial", 10, "bold"),
                                     padx=15, pady=8, cursor="hand2")
        btn_start_collect.pack(fill=tk.X, padx=10, pady=5)

        btn_stop_collect = tk.Button(scrollable_frame, text="⏹️ Stop Collecting",
                                    command=self.stop_dataset_collection,
                                    bg='#da3633', fg='white', font=("Arial", 10, "bold"),
                                    padx=15, pady=8, cursor="hand2")
        btn_stop_collect.pack(fill=tk.X, padx=10, pady=5)

        self.collect_status = tk.Label(scrollable_frame, text="Frames: 0",
                                       bg='#161b22', fg='#8b949e', font=("Arial", 9))
        self.collect_status.pack(pady=5)

        # 6. Google Drive Sync
        if GDRIVE_AVAILABLE:
            self.create_section(scrollable_frame, "☁️ GOOGLE DRIVE SYNC")

            btn_gdrive = tk.Button(scrollable_frame, text="Connect Google Drive",
                                  command=self.connect_gdrive,
                                  bg='#1f6feb', fg='white', font=("Arial", 9, "bold"),
                                  padx=15, pady=6, cursor="hand2")
            btn_gdrive.pack(fill=tk.X, padx=10, pady=5)

            self.gdrive_status = tk.Label(scrollable_frame, text="❌ Not connected",
                                          bg='#161b22', fg='#8b949e', font=("Arial", 8))
            self.gdrive_status.pack(pady=3)

        # 7. Info
        self.create_section(scrollable_frame, "ℹ️ INFORMATION")

        self.info_text = tk.Text(scrollable_frame, height=8, width=40,
                                bg='#0d1117', fg='#8b949e', font=("Courier", 8),
                                relief=tk.FLAT, padx=5, pady=5)
        self.info_text.pack(fill=tk.X, padx=10, pady=5)
        self.update_info()

    def create_section(self, parent, title):
        """Create section header"""
        frame = tk.Frame(parent, bg='#21262d', height=35)
        frame.pack(fill=tk.X, padx=5, pady=(10, 5))
        frame.pack_propagate(False)

        label = tk.Label(frame, text=title, bg='#21262d', fg='#c9d1d9',
                        font=("Arial", 10, "bold"))
        label.pack(anchor=tk.W, padx=10, pady=7)

    def setup_bindings(self):
        """Setup keyboard bindings"""
        self.root.bind("<space>", lambda e: self.takeoff() if not self.flying else self.land())
        self.root.bind("l", lambda e: self.lock_target())
        self.root.bind("u", lambda e: self.unlock_target())
        self.root.bind("c", lambda e: self.start_dataset_collection())
        self.root.bind("s", lambda e: self.stop_dataset_collection())

    def connect_drone(self):
        """Connect to drone"""
        if not DRONE_AVAILABLE:
            messagebox.showerror("Error", "djitellopy not installed!")
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
            self.conn_status.config(text=f"✅ Connected (Battery: {battery}%)", fg='#3fb950')
            self.status_var.set(f"Connected! Battery: {battery}%")

            # Start video thread
            self.video_running = True
            threading.Thread(target=self.video_loop, daemon=True).start()

        except Exception as e:
            messagebox.showerror("Connection Error", f"Failed to connect:\n{str(e)}")
            self.status_var.set("Connection failed")

    def load_sam_model(self):
        """Load SAM model"""
        if not SAM_AVAILABLE:
            messagebox.showerror("Error", "SAM not installed!")
            return

        # Ask for checkpoint file
        checkpoint = filedialog.askopenfilename(
            title="Select SAM Checkpoint (.pth)",
            filetypes=[("PyTorch Model", "*.pth"), ("All files", "*.*")]
        )

        if not checkpoint:
            return

        # Ask for model type
        model_window = tk.Toplevel(self.root)
        model_window.title("Select Model Type")
        model_window.geometry("300x200")
        model_window.configure(bg='#0d1117')
        model_window.transient(self.root)
        model_window.grab_set()

        tk.Label(model_window, text="Select SAM Model Type:",
                bg='#0d1117', fg='#c9d1d9', font=("Arial", 12, "bold")).pack(pady=20)

        model_var = tk.StringVar(value="vit_h")

        for model_type, label in [("vit_h", "ViT-H (Best)"), ("vit_l", "ViT-L"), ("vit_b", "ViT-B (Fastest)")]:
            tk.Radiobutton(model_window, text=label, variable=model_var, value=model_type,
                          bg='#0d1117', fg='#c9d1d9', selectcolor='#0d1117',
                          font=("Arial", 10)).pack(anchor=tk.W, padx=30)

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
                    messagebox.showinfo("Success", f"SAM model loaded!\nDevice: {self.device}")
                except Exception as e:
                    self.status_var.set("❌ SAM load failed")
                    messagebox.showerror("Error", f"Failed to load SAM:\n{str(e)}")

            threading.Thread(target=load_thread, daemon=True).start()

        tk.Button(model_window, text="Load Model", command=load,
                 bg='#238636', fg='white', font=("Arial", 11, "bold"),
                 padx=20, pady=10).pack(pady=20)

    def video_loop(self):
        """Main video processing loop"""
        while self.video_running and self.connected:
            try:
                if self.frame_read:
                    frame = self.frame_read.frame
                    self.current_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                    # Process tracking if active
                    if self.tracking_active and self.sam_loaded:
                        self.process_tracking()

                    # Collect dataset if active
                    if self.collecting_dataset:
                        self.capture_dataset_frame()

                    # Update display
                    self.update_video_display()

                time.sleep(0.03)  # ~30 FPS

            except Exception as e:
                print(f"Video loop error: {e}")
                time.sleep(0.1)

    def on_canvas_click(self, event):
        """Handle canvas click for object selection"""
        if not self.sam_loaded or self.current_frame is None:
            messagebox.showwarning("Not Ready", "Load SAM model and connect drone first!")
            return

        # Get click position relative to image
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
                # Convert to original image coordinates
                orig_x = int(click_x / scale)
                orig_y = int(click_y / scale)

                self.lock_points.append((orig_x, orig_y))
                self.status_var.set(f"Point added: ({orig_x}, {orig_y}). Click 'Lock Target' to segment.")

    def lock_target(self):
        """Lock target using SAM"""
        if not self.sam_loaded:
            messagebox.showwarning("SAM Not Loaded", "Load SAM model first!")
            return

        if len(self.lock_points) == 0:
            messagebox.showwarning("No Points", "Click on the object first!")
            return

        if self.current_frame is None:
            return

        self.status_var.set("Segmenting target...")
        self.root.update()

        def segment():
            try:
                # Set image in predictor
                self.predictor.set_image(self.current_frame)

                # Use points to segment
                points = np.array(self.lock_points)
                labels = np.ones(len(points))

                masks, scores, _ = self.predictor.predict(
                    point_coords=points,
                    point_labels=labels,
                    multimask_output=True
                )

                # Get best mask
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

            except Exception as e:
                self.status_var.set("❌ Segmentation failed")
                messagebox.showerror("Error", f"Segmentation failed:\n{str(e)}")

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
        self.status_var.set("Target unlocked")

    def process_tracking(self):
        """Process object tracking with SAM"""
        if self.target_mask is None or self.current_frame is None:
            return

        try:
            # Re-segment using previous box as prompt (tracking)
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
        """Automatically center drone on target"""
        if not self.target_center or not self.current_frame:
            return

        img_h, img_w = self.current_frame.shape[:2]
        cx, cy = self.target_center

        # Calculate offset from center
        offset_x = cx - img_w // 2
        offset_y = cy - img_h // 2

        # Dead zone
        threshold = 50

        # Adjust drone position
        try:
            if abs(offset_x) > threshold:
                velocity = int(np.clip(offset_x / 5, -30, 30))
                self.tello.send_rc_control(velocity, 0, 0, 0)

            if abs(offset_y) > threshold:
                velocity = int(np.clip(-offset_y / 5, -30, 30))
                self.tello.send_rc_control(0, 0, velocity, 0)

        except Exception as e:
            print(f"Auto-center error: {e}")

    def update_video_display(self):
        """Update video display with overlays"""
        if self.current_frame is None:
            return

        display = self.current_frame.copy()

        # Draw tracking overlay
        if self.tracking_active and self.target_mask is not None:
            # Semi-transparent mask overlay
            overlay = np.zeros_like(display)
            overlay[self.target_mask] = [0, 255, 0]
            display = cv2.addWeighted(display, 0.7, overlay, 0.3, 0)

            # Draw bounding box
            if self.target_box:
                x1, y1, x2, y2 = self.target_box
                cv2.rectangle(display, (x1, y1), (x2, y2), (0, 255, 255), 3)

            # Draw center point
            if self.target_center:
                cx, cy = self.target_center
                cv2.circle(display, (cx, cy), 8, (255, 0, 0), -1)
                cv2.circle(display, (cx, cy), 12, (255, 255, 255), 2)

            # Draw tracking history
            if len(self.tracking_history) > 1:
                points = list(self.tracking_history)
                for i in range(len(points) - 1):
                    cv2.line(display, points[i], points[i+1], (255, 255, 0), 2)

        # Draw lock points
        for px, py in self.lock_points:
            cv2.circle(display, (px, py), 6, (0, 255, 0), -1)
            cv2.circle(display, (px, py), 8, (255, 255, 255), 2)

        # Draw crosshair at center
        h, w = display.shape[:2]
        cv2.line(display, (w//2 - 20, h//2), (w//2 + 20, h//2), (255, 255, 255), 1)
        cv2.line(display, (w//2, h//2 - 20), (w//2, h//2 + 20), (255, 255, 255), 1)

        # Convert and display
        img = Image.fromarray(display)

        canvas_w = self.canvas.winfo_width()
        canvas_h = self.canvas.winfo_height()

        img_h, img_w = display.shape[:2]
        scale = min(canvas_w / img_w, canvas_h / img_h, 1.0)

        new_w = int(img_w * scale)
        new_h = int(img_h * scale)

        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        photo = ImageTk.PhotoImage(img)

        x_offset = (canvas_w - new_w) // 2
        y_offset = (canvas_h - new_h) // 2

        self.canvas.delete("all")
        self.canvas.create_image(x_offset, y_offset, anchor=tk.NW, image=photo)
        self.canvas.image = photo

    def start_dataset_collection(self):
        """Start collecting dataset"""
        if not self.tracking_active:
            messagebox.showwarning("No Target", "Lock a target first!")
            return

        Path(self.dataset_folder).mkdir(exist_ok=True)
        self.collecting_dataset = True
        self.frame_count = 0
        self.last_capture_time = time.time()

        self.status_var.set("📸 Collecting dataset...")

    def stop_dataset_collection(self):
        """Stop collecting dataset"""
        self.collecting_dataset = False
        self.status_var.set(f"✅ Dataset collection stopped. Saved {self.frame_count} frames.")

        if self.gdrive_enabled and self.frame_count > 0:
            if messagebox.askyesno("Upload", f"Upload {self.frame_count} frames to Google Drive?"):
                self.upload_dataset()

    def capture_dataset_frame(self):
        """Capture frame for dataset"""
        current_time = time.time()

        if current_time - self.last_capture_time >= self.capture_interval:
            if self.current_frame is not None and self.target_mask is not None:
                # Save original frame
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

                self.frame_count += 1
                self.collect_status.config(text=f"Frames: {self.frame_count}")
                self.last_capture_time = current_time

    def connect_gdrive(self):
        """Connect to Google Drive"""
        if not GDRIVE_AVAILABLE:
            messagebox.showerror("Error", "Google Drive integration not available!")
            return

        try:
            self.gdrive = DroneGDriveUploader()
            if self.gdrive.authenticate():
                self.gdrive.ensure_folder("drone_sam_dataset")
                self.gdrive_enabled = True
                self.gdrive_status.config(text="✅ Connected", fg='#3fb950')
                messagebox.showinfo("Success", "Connected to Google Drive!")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to connect:\n{str(e)}")

    def upload_dataset(self):
        """Upload dataset to Google Drive"""
        # Implementation for batch upload
        pass

    def takeoff(self):
        """Takeoff drone smoothly"""
        if not self.connected:
            self.status_var.set("❌ Not connected to drone")
            return

        if self.flying:
            self.status_var.set("⚠️ Already flying")
            return

        try:
            self.status_var.set("🛫 Taking off...")
            self.root.update()

            # Smooth takeoff
            self.tello.takeoff()
            time.sleep(0.5)  # Wait for stabilization

            self.flying = True
            self.status_var.set("✅ Flying - Ready to track")

        except Exception as e:
            self.flying = False
            self.status_var.set(f"❌ Takeoff failed: {str(e)}")
            print(f"Takeoff error: {e}")

    def land(self):
        """Land drone smoothly"""
        if not self.connected:
            return

        if not self.flying:
            self.status_var.set("⚠️ Already on ground")
            return

        try:
            self.status_var.set("🛬 Landing...")
            self.root.update()

            # Stop any movement first
            if self.tello:
                self.tello.send_rc_control(0, 0, 0, 0)
                time.sleep(0.3)

            # Smooth landing
            self.tello.land()
            time.sleep(0.5)

            self.flying = False
            self.tracking_active = False
            self.status_var.set("✅ Landed safely")

        except Exception as e:
            self.status_var.set(f"❌ Landing failed: {str(e)}")
            print(f"Landing error: {e}")

    def update_info(self):
        """Update info panel"""
        info = f"""
🚁 DRONE SAM TRACKER v1.0

Features:
• Real-time SAM segmentation
• Object locking while flying
• Auto-stabilization
• Dataset collection
• Google Drive sync

Controls:
SPACE - Takeoff/Land
L - Lock target
U - Unlock target
C - Start collecting
S - Stop collecting

Status:
Drone: {'✅' if self.connected else '❌'}
SAM: {'✅' if self.sam_loaded else '❌'}
Tracking: {'🟢' if self.tracking_active else '⚪'}
"""
        self.info_text.delete(1.0, tk.END)
        self.info_text.insert(1.0, info)

        self.root.after(1000, self.update_info)

    def run(self):
        """Run the application"""
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

def main():
    if not SAM_AVAILABLE:
        print("⚠️ SAM not available. Please install:")
        print("pip install segment-anything torch torchvision")

    if not DRONE_AVAILABLE:
        print("⚠️ Drone library not available. Please install:")
        print("pip install djitellopy")

    app = DroneObjectTracker()
    app.run()

if __name__ == "__main__":
    main()

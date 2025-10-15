import os, sys
import tkinter as tk
from tkinter import filedialog, messagebox, Canvas
from pathlib import Path
from PIL import Image, ImageTk, ImageDraw
import numpy as np
import threading

try:
    import torch
    from segment_anything import sam_model_registry, SamPredictor
    import cv2
except ImportError as e:
    print(f"Missing dependencies: {e}")
    print("Please install: pip install torch segment-anything opencv-python pillow")
    sys.exit(1)

class SAMGuiTkinter:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("SAM (Segment Anything Model) - Tkinter GUI")
        self.root.geometry("1400x900")

        # SAM Model
        self.predictor = None
        self.sam = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # Image data
        self.image_paths = []
        self.current_idx = 0
        self.original_image = None
        self.display_image = None
        self.current_photo = None

        # Segmentation data
        self.positive_points = []
        self.negative_points = []
        self.current_mask = None
        self.scale = 1.0

        # Box selection mode
        self.box_mode = False
        self.box_start = None
        self.box_end = None
        self.current_box = None
        self.temp_box_id = None

        # Canvas offsets
        self.x_offset = 0
        self.y_offset = 0

        # Output
        self.output_dir = "sam_output"

        self.setup_ui()

    def setup_ui(self):
        # Top control panel
        control_frame = tk.Frame(self.root, bg='#2196F3', height=120)
        control_frame.pack(fill=tk.X, side=tk.TOP)
        control_frame.pack_propagate(False)

        # Title
        title = tk.Label(control_frame, text="SAM - Interactive Segmentation",
                        font=("Arial", 18, "bold"), bg='#2196F3', fg='white')
        title.pack(pady=5)

        # Buttons row 1
        btn_frame1 = tk.Frame(control_frame, bg='#2196F3')
        btn_frame1.pack(pady=5)

        tk.Button(btn_frame1, text="📁 Load Images", command=self.load_images,
                 bg='#4CAF50', fg='white', font=("Arial", 10, "bold"),
                 padx=15, pady=8, cursor="hand2").pack(side=tk.LEFT, padx=5)

        tk.Button(btn_frame1, text="🤖 Load SAM Model", command=self.load_model,
                 bg='#FF9800', fg='white', font=("Arial", 10, "bold"),
                 padx=15, pady=8, cursor="hand2").pack(side=tk.LEFT, padx=5)

        tk.Button(btn_frame1, text="▶️ Run SAM", command=self.run_segmentation,
                 bg='#2196F3', fg='white', font=("Arial", 10, "bold"),
                 padx=15, pady=8, cursor="hand2").pack(side=tk.LEFT, padx=5)

        tk.Button(btn_frame1, text="💾 Save Result", command=self.save_result,
                 bg='#9C27B0', fg='white', font=("Arial", 10, "bold"),
                 padx=15, pady=8, cursor="hand2").pack(side=tk.LEFT, padx=5)

        tk.Button(btn_frame1, text="🗑️ Clear Points", command=self.clear_points,
                 bg='#F44336', fg='white', font=("Arial", 10, "bold"),
                 padx=15, pady=8, cursor="hand2").pack(side=tk.LEFT, padx=5)

        self.box_mode_btn = tk.Button(btn_frame1, text="📦 Box Mode: OFF", command=self.toggle_box_mode,
                 bg='#607D8B', fg='white', font=("Arial", 10, "bold"),
                 padx=15, pady=8, cursor="hand2")
        self.box_mode_btn.pack(side=tk.LEFT, padx=5)

        # Buttons row 2
        btn_frame2 = tk.Frame(control_frame, bg='#2196F3')
        btn_frame2.pack(pady=5)

        tk.Button(btn_frame2, text="⬅️ Previous", command=self.previous_image,
                 bg='#607D8B', fg='white', font=("Arial", 10, "bold"),
                 padx=15, pady=5).pack(side=tk.LEFT, padx=5)

        self.image_label = tk.Label(btn_frame2, text="No image loaded",
                                    bg='#2196F3', fg='white', font=("Arial", 10, "bold"))
        self.image_label.pack(side=tk.LEFT, padx=20)

        tk.Button(btn_frame2, text="Next ➡️", command=self.next_image,
                 bg='#607D8B', fg='white', font=("Arial", 10, "bold"),
                 padx=15, pady=5).pack(side=tk.LEFT, padx=5)

        # Main content area
        content_frame = tk.Frame(self.root)
        content_frame.pack(fill=tk.BOTH, expand=True, side=tk.TOP)

        # Left: Canvas for image
        canvas_frame = tk.Frame(content_frame, bg='#f0f0f0')
        canvas_frame.pack(fill=tk.BOTH, expand=True, side=tk.LEFT, padx=10, pady=10)

        self.canvas = Canvas(canvas_frame, bg='#333333', cursor="crosshair")
        self.canvas.pack(fill=tk.BOTH, expand=True)

        # Bind mouse events
        self.canvas.bind("<Button-1>", self.on_left_click)
        self.canvas.bind("<Button-3>", self.on_right_click)
        self.canvas.bind("<B1-Motion>", self.on_drag)
        self.canvas.bind("<ButtonRelease-1>", self.on_release)

        # Right: Instructions and info
        info_frame = tk.Frame(content_frame, bg='#f0f0f0', width=300)
        info_frame.pack(fill=tk.BOTH, side=tk.RIGHT, padx=10, pady=10)
        info_frame.pack_propagate(False)

        # Instructions
        instructions = """
📖 INSTRUCTIONS

1️⃣ Load Images
   Click "Load Images" to select
   folder or files

2️⃣ Load SAM Model
   Click "Load SAM Model" and
   select .pth checkpoint file

3️⃣ Select Object

   🎯 POINT MODE (Default):
   LEFT CLICK: Add positive point
   RIGHT CLICK: Add negative point

   📦 BOX MODE:
   Click "Box Mode" button
   DRAG to draw box around object

4️⃣ Run Segmentation
   Click "Run SAM" to segment

5️⃣ Save Result
   Click "Save Result" to export

🎨 VISUAL:
   🟢 Green = Positive (object)
   🔴 Red = Negative (background)
   🟦 Blue Box = Selection area

⌨️ SHORTCUTS:
   ← → : Navigate images
   R : Run segmentation
   S : Save result
   C : Clear points
   B : Toggle box mode
"""

        info_text = tk.Text(info_frame, wrap=tk.WORD, bg='white',
                           font=("Courier", 9), padx=10, pady=10)
        info_text.pack(fill=tk.BOTH, expand=True)
        info_text.insert(1.0, instructions)
        info_text.config(state=tk.DISABLED)

        # Status bar
        self.status_var = tk.StringVar(value="Ready. Load images and SAM model to start.")
        status_bar = tk.Label(self.root, textvariable=self.status_var,
                             bg='#333333', fg='white', font=("Arial", 10),
                             anchor=tk.W, padx=10, pady=5)
        status_bar.pack(fill=tk.X, side=tk.BOTTOM)

        # Keyboard shortcuts
        self.root.bind("<Left>", lambda e: self.previous_image())
        self.root.bind("<Right>", lambda e: self.next_image())
        self.root.bind("r", lambda e: self.run_segmentation())
        self.root.bind("s", lambda e: self.save_result())
        self.root.bind("c", lambda e: self.clear_points())
        self.root.bind("b", lambda e: self.toggle_box_mode())

    def toggle_box_mode(self):
        self.box_mode = not self.box_mode
        if self.box_mode:
            self.box_mode_btn.config(text="📦 Box Mode: ON", bg='#4CAF50')
            self.canvas.config(cursor="crosshair")
            self.status_var.set("Box mode ON - Drag to draw selection box")
        else:
            self.box_mode_btn.config(text="📦 Box Mode: OFF", bg='#607D8B')
            self.canvas.config(cursor="crosshair")
            self.status_var.set("Point mode ON - Click to add points")

    def load_images(self):
        choice = messagebox.askquestion("Load Images", "Load folder? (No = select files)")

        if choice == 'yes':
            folder = filedialog.askdirectory(title="Select Images Folder")
            if folder:
                exts = ('.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff')
                self.image_paths = [str(p) for p in Path(folder).glob('*')
                                   if p.suffix.lower() in exts]
        else:
            files = filedialog.askopenfilenames(
                title="Select Image Files",
                filetypes=[("Image files", "*.jpg *.jpeg *.png *.bmp *.tif *.tiff")]
            )
            self.image_paths = list(files)

        if self.image_paths:
            self.current_idx = 0
            self.load_current_image()
            self.status_var.set(f"Loaded {len(self.image_paths)} images")
        else:
            messagebox.showwarning("No Images", "No images found!")

    def load_model(self):
        checkpoint_file = filedialog.askopenfilename(
            title="Select SAM Checkpoint (.pth)",
            filetypes=[("PyTorch Model", "*.pth"), ("All files", "*.*")]
        )

        if not checkpoint_file:
            return

        # Ask model type
        model_window = tk.Toplevel(self.root)
        model_window.title("Select Model Type")
        model_window.geometry("300x200")
        model_window.transient(self.root)
        model_window.grab_set()

        tk.Label(model_window, text="Select SAM Model Type:",
                font=("Arial", 12, "bold")).pack(pady=20)

        model_var = tk.StringVar(value="vit_h")

        tk.Radiobutton(model_window, text="ViT-H (Huge)", variable=model_var,
                      value="vit_h", font=("Arial", 10)).pack(anchor=tk.W, padx=30)
        tk.Radiobutton(model_window, text="ViT-L (Large)", variable=model_var,
                      value="vit_l", font=("Arial", 10)).pack(anchor=tk.W, padx=30)
        tk.Radiobutton(model_window, text="ViT-B (Base)", variable=model_var,
                      value="vit_b", font=("Arial", 10)).pack(anchor=tk.W, padx=30)

        def confirm():
            model_window.destroy()
            self.status_var.set("Loading SAM model... Please wait...")
            self.root.update()

            def load():
                try:
                    self.sam = sam_model_registry[model_var.get()](checkpoint=checkpoint_file)
                    self.sam = self.sam.to(self.device)
                    self.predictor = SamPredictor(self.sam)
                    self.status_var.set(f"✅ SAM model loaded ({model_var.get()}, {self.device})")
                    messagebox.showinfo("Success", f"SAM model loaded successfully!\nDevice: {self.device}")
                except Exception as e:
                    self.status_var.set("❌ Failed to load model")
                    messagebox.showerror("Error", f"Failed to load model:\n{str(e)}")

            thread = threading.Thread(target=load, daemon=True)
            thread.start()

        tk.Button(model_window, text="Load Model", command=confirm,
                 bg='#4CAF50', fg='white', font=("Arial", 11, "bold"),
                 padx=20, pady=10).pack(pady=20)

    def load_current_image(self):
        if not self.image_paths:
            return

        path = self.image_paths[self.current_idx]

        # Load with OpenCV
        self.original_image = cv2.imread(path)
        self.original_image = cv2.cvtColor(self.original_image, cv2.COLOR_BGR2RGB)

        # Set image in predictor if model loaded
        if self.predictor:
            self.predictor.set_image(self.original_image)

        # Clear points and mask
        self.positive_points = []
        self.negative_points = []
        self.current_mask = None
        self.current_box = None
        self.box_start = None
        self.box_end = None

        # Update display
        self.update_canvas()

        # Update label
        self.image_label.config(text=f"Image {self.current_idx + 1}/{len(self.image_paths)}: {Path(path).name}")
        self.status_var.set(f"Loaded: {Path(path).name}")

    def update_canvas(self):
        if self.original_image is None:
            return

        # Get canvas size
        self.canvas.update()
        canvas_w = self.canvas.winfo_width()
        canvas_h = self.canvas.winfo_height()

        img_h, img_w = self.original_image.shape[:2]

        # Calculate scale to fit canvas
        self.scale = min(canvas_w / img_w, canvas_h / img_h, 1.0)

        new_w = int(img_w * self.scale)
        new_h = int(img_h * self.scale)

        # Create display image
        img = Image.fromarray(self.original_image)
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        # Apply mask overlay if exists
        if self.current_mask is not None:
            mask_resized = cv2.resize(self.current_mask.astype(np.uint8), (new_w, new_h),
                                     interpolation=cv2.INTER_NEAREST)

            # Create overlay
            overlay = Image.new('RGBA', (new_w, new_h), (0, 255, 0, 0))
            draw = ImageDraw.Draw(overlay)

            # Draw mask in semi-transparent green
            for y in range(new_h):
                for x in range(new_w):
                    if mask_resized[y, x] > 0:
                        draw.point((x, y), fill=(0, 255, 0, 100))

            img = img.convert('RGBA')
            img = Image.alpha_composite(img, overlay)
            img = img.convert('RGB')

        # Draw points
        draw = ImageDraw.Draw(img)

        # Positive points (green)
        for px, py in self.positive_points:
            x, y = int(px * self.scale), int(py * self.scale)
            r = 8
            draw.ellipse([x-r, y-r, x+r, y+r], fill='lime', outline='darkgreen', width=3)

        # Negative points (red)
        for px, py in self.negative_points:
            x, y = int(px * self.scale), int(py * self.scale)
            r = 8
            draw.ellipse([x-r, y-r, x+r, y+r], fill='red', outline='darkred', width=3)

        # Convert to PhotoImage
        self.current_photo = ImageTk.PhotoImage(img)

        # Clear canvas and draw
        self.canvas.delete("all")

        # Center image
        self.x_offset = (canvas_w - new_w) // 2
        self.y_offset = (canvas_h - new_h) // 2

        self.canvas.create_image(self.x_offset, self.y_offset, anchor=tk.NW, image=self.current_photo)

        # Draw box if exists
        if self.current_box is not None:
            x1, y1, x2, y2 = self.current_box
            bx1 = int(x1 * self.scale) + self.x_offset
            by1 = int(y1 * self.scale) + self.y_offset
            bx2 = int(x2 * self.scale) + self.x_offset
            by2 = int(y2 * self.scale) + self.y_offset
            self.canvas.create_rectangle(bx1, by1, bx2, by2, outline='cyan', width=3)

    def on_left_click(self, event):
        if self.original_image is None:
            messagebox.showwarning("No Image", "Please load an image first!")
            return

        img_h, img_w = self.original_image.shape[:2]
        new_w = int(img_w * self.scale)
        new_h = int(img_h * self.scale)

        click_x = event.x - self.x_offset
        click_y = event.y - self.y_offset

        # Check if click is within image
        if 0 <= click_x < new_w and 0 <= click_y < new_h:
            orig_x = click_x / self.scale
            orig_y = click_y / self.scale

            if self.box_mode:
                # Start box selection
                self.box_start = (orig_x, orig_y)
                self.box_end = (orig_x, orig_y)
                self.status_var.set("Drag to create selection box...")
            else:
                # Add positive point
                self.positive_points.append((orig_x, orig_y))
                self.update_canvas()
                self.status_var.set(f"Added positive point ({len(self.positive_points)} total)")

    def on_drag(self, event):
        if self.box_mode and self.box_start is not None and self.original_image is not None:
            img_h, img_w = self.original_image.shape[:2]
            new_w = int(img_w * self.scale)
            new_h = int(img_h * self.scale)

            drag_x = event.x - self.x_offset
            drag_y = event.y - self.y_offset

            # Clamp to image bounds
            drag_x = max(0, min(drag_x, new_w - 1))
            drag_y = max(0, min(drag_y, new_h - 1))

            orig_x = drag_x / self.scale
            orig_y = drag_y / self.scale

            self.box_end = (orig_x, orig_y)

            # Update display with temporary box
            x1, y1 = self.box_start
            x2, y2 = self.box_end

            # Normalize box coordinates
            box_x1, box_x2 = sorted([x1, x2])
            box_y1, box_y2 = sorted([y1, y2])

            self.current_box = (box_x1, box_y1, box_x2, box_y2)
            self.update_canvas()

    def on_release(self, event):
        if self.box_mode and self.box_start is not None and self.box_end is not None:
            x1, y1 = self.box_start
            x2, y2 = self.box_end

            # Normalize box
            box_x1, box_x2 = sorted([x1, x2])
            box_y1, box_y2 = sorted([y1, y2])

            self.current_box = (box_x1, box_y1, box_x2, box_y2)
            self.status_var.set(f"Box created. Click 'Run SAM' to segment.")
            self.update_canvas()

    def on_right_click(self, event):
        if self.original_image is None or self.box_mode:
            return

        img_h, img_w = self.original_image.shape[:2]
        new_w = int(img_w * self.scale)
        new_h = int(img_h * self.scale)

        click_x = event.x - self.x_offset
        click_y = event.y - self.y_offset

        if 0 <= click_x < new_w and 0 <= click_y < new_h:
            orig_x = click_x / self.scale
            orig_y = click_y / self.scale

            self.negative_points.append((orig_x, orig_y))
            self.update_canvas()
            self.status_var.set(f"Added negative point ({len(self.negative_points)} total)")

    def run_segmentation(self):
        if self.predictor is None:
            messagebox.showwarning("No Model", "Please load SAM model first!")
            return

        if self.original_image is None:
            messagebox.showwarning("No Image", "Please load an image first!")
            return

        # Check if we have either points or box
        has_points = len(self.positive_points) > 0
        has_box = self.current_box is not None

        if not has_points and not has_box:
            messagebox.showwarning("No Input", "Please add points or draw a box first!")
            return

        self.status_var.set("Running segmentation...")
        self.root.update()

        def segment():
            try:
                # Prepare points
                points = None
                labels = None

                if has_points:
                    points = np.array(self.positive_points + self.negative_points)
                    labels = np.array([1] * len(self.positive_points) + [0] * len(self.negative_points))

                # Prepare box
                box = None
                if has_box:
                    x1, y1, x2, y2 = self.current_box
                    box = np.array([[x1, y1, x2, y2]], dtype=np.float32)

                # Run SAM
                masks, scores, _ = self.predictor.predict(
                    point_coords=points,
                    point_labels=labels,
                    box=box,
                    multimask_output=True
                )

                # Get best mask
                best_idx = np.argmax(scores)
                self.current_mask = masks[best_idx]

                self.root.after(0, self.update_canvas)
                self.status_var.set(f"✅ Segmentation complete (score: {scores[best_idx]:.3f})")

            except Exception as e:
                self.status_var.set("❌ Segmentation failed")
                import traceback
                traceback.print_exc()
                self.root.after(0, lambda: messagebox.showerror("Error", f"Segmentation failed:\n{str(e)}"))

        thread = threading.Thread(target=segment, daemon=True)
        thread.start()

    def save_result(self):
        if self.current_mask is None:
            messagebox.showwarning("No Mask", "Please run segmentation first!")
            return

        Path(self.output_dir).mkdir(exist_ok=True)

        filename = Path(self.image_paths[self.current_idx]).stem

        # Save mask
        mask_path = Path(self.output_dir) / f"{filename}_mask.png"
        cv2.imwrite(str(mask_path), (self.current_mask * 255).astype(np.uint8))

        # Save cutout with transparency
        rgba = cv2.cvtColor(self.original_image, cv2.COLOR_RGB2RGBA)
        rgba[:, :, 3] = (self.current_mask * 255).astype(np.uint8)
        cutout_path = Path(self.output_dir) / f"{filename}_cutout.png"
        cv2.imwrite(str(cutout_path), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))

        self.status_var.set(f"✅ Saved to {self.output_dir}/")
        messagebox.showinfo("Saved", f"Results saved:\n{mask_path}\n{cutout_path}")

    def clear_points(self):
        self.positive_points = []
        self.negative_points = []
        self.current_mask = None
        self.current_box = None
        self.box_start = None
        self.box_end = None
        self.update_canvas()
        self.status_var.set("Cleared all points, box, and mask")

    def next_image(self):
        if not self.image_paths:
            return
        self.current_idx = (self.current_idx + 1) % len(self.image_paths)
        self.load_current_image()

    def previous_image(self):
        if not self.image_paths:
            return
        self.current_idx = (self.current_idx - 1) % len(self.image_paths)
        self.load_current_image()

    def run(self):
        self.root.mainloop()

def main():
    app = SAMGuiTkinter()
    app.run()

if __name__ == "__main__":
    main()

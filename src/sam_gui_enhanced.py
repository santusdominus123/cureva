import os, sys
import tkinter as tk
from tkinter import filedialog, messagebox
from pathlib import Path
import threading

# Import the original SAM GUI components
try:
    from sam_gui import SAMGui, list_images
except ImportError:
    print("Error: Make sure sam_gui.py is in the same directory")
    sys.exit(1)

class SAMGuiLauncher:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("SAM GUI Launcher")
        self.root.geometry("800x650")
        self.root.configure(bg='#f0f0f0')

        # Variables
        self.images_path = tk.StringVar()
        self.checkpoint_path = tk.StringVar()
        self.output_path = tk.StringVar(value="sam_output")
        self.model_type = tk.StringVar(value="vit_h")
        self.max_display = tk.IntVar(value=1280)

        # Recommended checkpoint URLs for reference
        self.checkpoint_urls = {
            "vit_h": "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth",
            "vit_l": "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_l_0b3195.pth",
            "vit_b": "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth"
        }

        self.setup_ui()

    def setup_ui(self):
        # Title
        title_frame = tk.Frame(self.root, bg='#2196F3', height=60)
        title_frame.pack(fill=tk.X)
        title_label = tk.Label(title_frame, text="SAM (Segment Anything Model) GUI Launcher",
                              font=("Arial", 18, "bold"), bg='#2196F3', fg='white')
        title_label.pack(pady=15)

        # Main container with scrollbar
        main_frame = tk.Frame(self.root, bg='#f0f0f0', padx=30, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)

        # 1. Images Selection
        self.create_section_header(main_frame, "1. SELECT IMAGES")

        images_label = tk.Label(main_frame, text="Images folder or single image:",
                               bg='#f0f0f0', font=("Arial", 10))
        images_label.pack(anchor=tk.W, pady=(5, 2))

        images_frame = tk.Frame(main_frame, bg='#f0f0f0')
        images_frame.pack(fill=tk.X, pady=5)

        images_entry = tk.Entry(images_frame, textvariable=self.images_path,
                               font=("Arial", 10), width=50)
        images_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))

        btn_folder = tk.Button(images_frame, text="Browse Folder",
                              command=self.browse_folder,
                              bg='#2196F3', fg='white', font=("Arial", 9, "bold"),
                              padx=10, pady=5, cursor="hand2")
        btn_folder.pack(side=tk.LEFT, padx=2)

        btn_file = tk.Button(images_frame, text="Browse File",
                            command=self.browse_image,
                            bg='#2196F3', fg='white', font=("Arial", 9, "bold"),
                            padx=10, pady=5, cursor="hand2")
        btn_file.pack(side=tk.LEFT)

        # 2. SAM Model Selection
        self.create_section_header(main_frame, "2. SELECT SAM MODEL CHECKPOINT")

        checkpoint_label = tk.Label(main_frame, text="Model checkpoint file (.pth):",
                                   bg='#f0f0f0', font=("Arial", 10))
        checkpoint_label.pack(anchor=tk.W, pady=(5, 2))

        checkpoint_frame = tk.Frame(main_frame, bg='#f0f0f0')
        checkpoint_frame.pack(fill=tk.X, pady=5)

        checkpoint_entry = tk.Entry(checkpoint_frame, textvariable=self.checkpoint_path,
                                   font=("Arial", 10), width=50)
        checkpoint_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))

        btn_checkpoint = tk.Button(checkpoint_frame, text="Browse Checkpoint",
                                  command=self.browse_checkpoint,
                                  bg='#2196F3', fg='white', font=("Arial", 9, "bold"),
                                  padx=10, pady=5, cursor="hand2")
        btn_checkpoint.pack(side=tk.LEFT)

        # Model type selection
        model_label = tk.Label(main_frame, text="Select model type:",
                              bg='#f0f0f0', font=("Arial", 10))
        model_label.pack(anchor=tk.W, pady=(10, 5))

        model_frame = tk.Frame(main_frame, bg='#f0f0f0')
        model_frame.pack(fill=tk.X, pady=5)

        rb1 = tk.Radiobutton(model_frame, text="ViT-H (Huge - Best Quality)",
                            variable=self.model_type, value="vit_h",
                            bg='#f0f0f0', font=("Arial", 10), cursor="hand2")
        rb1.pack(side=tk.LEFT, padx=15)

        rb2 = tk.Radiobutton(model_frame, text="ViT-L (Large)",
                            variable=self.model_type, value="vit_l",
                            bg='#f0f0f0', font=("Arial", 10), cursor="hand2")
        rb2.pack(side=tk.LEFT, padx=15)

        rb3 = tk.Radiobutton(model_frame, text="ViT-B (Base - Fastest)",
                            variable=self.model_type, value="vit_b",
                            bg='#f0f0f0', font=("Arial", 10), cursor="hand2")
        rb3.pack(side=tk.LEFT, padx=15)

        # Download info button
        info_frame = tk.Frame(main_frame, bg='#f0f0f0')
        info_frame.pack(fill=tk.X, pady=5)

        info_label = tk.Label(info_frame, text="💡 Don't have checkpoint files?",
                             bg='#f0f0f0', fg='#1976D2', font=("Arial", 10))
        info_label.pack(side=tk.LEFT)

        btn_download_info = tk.Button(info_frame, text="Show Download Links",
                                     command=self.show_download_info,
                                     bg='#FF9800', fg='white', font=("Arial", 9, "bold"),
                                     padx=10, pady=3, cursor="hand2")
        btn_download_info.pack(side=tk.LEFT, padx=10)

        # 3. Output Settings
        self.create_section_header(main_frame, "3. OUTPUT SETTINGS")

        output_label = tk.Label(main_frame, text="Output folder:",
                               bg='#f0f0f0', font=("Arial", 10))
        output_label.pack(anchor=tk.W, pady=(5, 2))

        output_frame = tk.Frame(main_frame, bg='#f0f0f0')
        output_frame.pack(fill=tk.X, pady=5)

        output_entry = tk.Entry(output_frame, textvariable=self.output_path,
                               font=("Arial", 10), width=50)
        output_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))

        btn_output = tk.Button(output_frame, text="Browse Output",
                              command=self.browse_output,
                              bg='#2196F3', fg='white', font=("Arial", 9, "bold"),
                              padx=10, pady=5, cursor="hand2")
        btn_output.pack(side=tk.LEFT)

        # Max display size
        display_frame = tk.Frame(main_frame, bg='#f0f0f0')
        display_frame.pack(fill=tk.X, pady=10)

        display_label = tk.Label(display_frame, text="Max display size (pixels):",
                                bg='#f0f0f0', font=("Arial", 10))
        display_label.pack(side=tk.LEFT)

        display_entry = tk.Entry(display_frame, textvariable=self.max_display,
                                font=("Arial", 10), width=10)
        display_entry.pack(side=tk.LEFT, padx=10)

        # Separator
        separator = tk.Frame(main_frame, height=2, bg='#cccccc')
        separator.pack(fill=tk.X, pady=20)

        # LAUNCH BUTTON - BIG AND VISIBLE
        launch_frame = tk.Frame(main_frame, bg='#f0f0f0')
        launch_frame.pack(pady=20)

        self.launch_btn = tk.Button(
            launch_frame,
            text="🚀 LAUNCH SAM GUI 🚀",
            command=self.launch_sam,
            bg='#4CAF50',
            fg='white',
            font=("Arial", 16, "bold"),
            width=25,
            height=2,
            cursor="hand2",
            relief=tk.RAISED,
            borderwidth=4,
            activebackground='#45a049',
            activeforeground='white'
        )
        self.launch_btn.pack()

        # Status
        self.status_var = tk.StringVar(value="Ready to launch")
        status_label = tk.Label(main_frame, textvariable=self.status_var,
                               bg='#f0f0f0', fg='#666666', font=("Arial", 10))
        status_label.pack(pady=10)

    def create_section_header(self, parent, text):
        header_frame = tk.Frame(parent, bg='#e0e0e0', height=35)
        header_frame.pack(fill=tk.X, pady=(15, 10))
        header_label = tk.Label(header_frame, text=text,
                               bg='#e0e0e0', font=("Arial", 11, "bold"))
        header_label.pack(anchor=tk.W, padx=10, pady=7)

    def browse_folder(self):
        folder = filedialog.askdirectory(title="Select Images Folder")
        if folder:
            self.images_path.set(folder)

    def browse_image(self):
        file = filedialog.askopenfilename(
            title="Select Image File",
            filetypes=[
                ("Image files", "*.jpg *.jpeg *.png *.bmp *.tif *.tiff"),
                ("All files", "*.*")
            ]
        )
        if file:
            self.images_path.set(file)

    def browse_checkpoint(self):
        file = filedialog.askopenfilename(
            title="Select SAM Checkpoint (.pth)",
            filetypes=[
                ("PyTorch Model", "*.pth"),
                ("All files", "*.*")
            ]
        )
        if file:
            self.checkpoint_path.set(file)

    def browse_output(self):
        folder = filedialog.askdirectory(title="Select Output Folder")
        if folder:
            self.output_path.set(folder)

    def show_download_info(self):
        info = "Download SAM Model Checkpoints:\n\n"
        info += "ViT-H (2.4GB - Best Quality):\n"
        info += f"{self.checkpoint_urls['vit_h']}\n\n"
        info += "ViT-L (1.2GB - Good Balance):\n"
        info += f"{self.checkpoint_urls['vit_l']}\n\n"
        info += "ViT-B (375MB - Fastest):\n"
        info += f"{self.checkpoint_urls['vit_b']}\n\n"
        info += "Download one of these files and select it using the Browse button."

        msg_window = tk.Toplevel(self.root)
        msg_window.title("SAM Checkpoint Download Links")
        msg_window.geometry("700x300")
        msg_window.configure(bg='white')

        text = tk.Text(msg_window, wrap=tk.WORD, padx=15, pady=15,
                      font=("Arial", 10), bg='white')
        text.pack(fill=tk.BOTH, expand=True)
        text.insert(1.0, info)
        text.config(state=tk.DISABLED)

        # Add scrollbar
        scrollbar = tk.Scrollbar(text)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        text.config(yscrollcommand=scrollbar.set)
        scrollbar.config(command=text.yview)

    def validate_inputs(self):
        if not self.images_path.get():
            messagebox.showerror("Error", "Please select images folder or file")
            return False

        if not Path(self.images_path.get()).exists():
            messagebox.showerror("Error", "Images path does not exist")
            return False

        if not self.checkpoint_path.get():
            messagebox.showerror("Error", "Please select SAM checkpoint file")
            return False

        if not Path(self.checkpoint_path.get()).exists():
            messagebox.showerror("Error", "Checkpoint file does not exist")
            return False

        return True

    def launch_sam(self):
        print("Launch button clicked!")
        print(f"Images path: {self.images_path.get()}")
        print(f"Checkpoint path: {self.checkpoint_path.get()}")

        if not self.validate_inputs():
            print("Validation failed")
            return

        print("Validation passed, starting SAM...")
        self.status_var.set("Loading SAM model... Please wait...")
        self.launch_btn.config(state=tk.DISABLED, bg='#cccccc')
        self.root.update()

        # Run SAM GUI in a separate thread to avoid blocking
        def run_sam():
            try:
                print("Thread started")
                imgs = list_images(self.images_path.get())
                print(f"Found {len(imgs)} images")

                if not imgs:
                    print("No images found")
                    self.root.after(0, lambda: messagebox.showerror("Error", "No images found in the specified path"))
                    self.root.after(0, lambda: self.launch_btn.config(state=tk.NORMAL, bg='#4CAF50'))
                    self.root.after(0, lambda: self.status_var.set("Ready to launch"))
                    return

                print("Hiding launcher window")
                self.root.withdraw()

                print("Initializing SAM GUI...")
                # Launch SAM GUI
                app = SAMGui(
                    img_paths=imgs,
                    out_dir=self.output_path.get(),
                    sam_checkpoint=self.checkpoint_path.get(),
                    sam_model=self.model_type.get(),
                    max_display_size=self.max_display.get()
                )

                print("Starting SAM GUI loop")
                app.loop()

                # Show launcher again after SAM GUI closes
                print("SAM GUI closed, showing launcher")
                self.root.deiconify()
                self.status_var.set("Ready to launch")
                self.launch_btn.config(state=tk.NORMAL, bg='#4CAF50')

            except Exception as e:
                print(f"ERROR: {str(e)}")
                import traceback
                traceback.print_exc()
                self.root.deiconify()
                self.root.after(0, lambda: messagebox.showerror("Error", f"Failed to launch SAM GUI:\n{str(e)}\n\nCheck console for details"))
                self.launch_btn.config(state=tk.NORMAL, bg='#4CAF50')
                self.status_var.set("Error occurred")

        print("Creating thread")
        thread = threading.Thread(target=run_sam, daemon=True)
        thread.start()
        print("Thread started")

    def run(self):
        self.root.mainloop()

def main():
    app = SAMGuiLauncher()
    app.run()

if __name__ == "__main__":
    main()

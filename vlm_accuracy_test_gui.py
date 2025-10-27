"""
🧪 VLM ACCURACY TESTING SYSTEM - GUI VERSION WITH ANALYTICS
============================================================
GUI untuk menghitung akurasi Vision-Language Model (VLM)
dengan visualisasi grafik dan analisis lengkap.

Author: CureVa Team
Version: 2.0
Model: Google Gemini 2.0 Flash Experimental
"""

# Suppress warnings
import os
import warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['GRPC_VERBOSITY'] = 'ERROR'
os.environ['GLOG_minloglevel'] = '2'
warnings.filterwarnings('ignore')

import google.generativeai as genai
from PIL import Image, ImageTk
import json
import time
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import threading
from pathlib import Path
from typing import Dict, List, Any, Tuple
import re
from datetime import datetime
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import seaborn as sns
import numpy as np

# Set style
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

COLORS = {
    'primary': '#2196F3',
    'success': '#4CAF50',
    'warning': '#FF9800',
    'danger': '#F44336',
    'info': '#00BCD4',
    'purple': '#9C27B0',
    'teal': '#009688'
}

class VLMAccuracyTesterGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("🧪 VLM Accuracy Testing System - Professional GUI")
        self.root.geometry("1400x900")
        self.root.configure(bg='#f0f0f0')

        # Variables
        self.api_key_var = tk.StringVar(value="AIzaSyBO8v7wSaDK7kGq70uzRunqq7ZhtlDyAWk")
        self.model_name = "gemini-2.0-flash-exp"
        self.scoring_mode = tk.StringVar(value="auto")
        self.image_paths = []
        self.test_types = []
        self.results = []
        self.scores = []
        self.is_testing = False
        self.output_folder = Path("./vlm_test_results")
        self.output_folder.mkdir(exist_ok=True, parents=True)

        self.setup_ui()

    def setup_ui(self):
        """Setup GUI components"""

        # Create main paned window for left panel and right panel
        paned = tk.PanedWindow(self.root, orient='horizontal', bg='#f0f0f0', sashwidth=5)
        paned.pack(fill='both', expand=True)

        # LEFT PANEL - Controls
        left_panel = tk.Frame(paned, bg='#f0f0f0', width=600)
        paned.add(left_panel, minsize=550)

        self.setup_left_panel(left_panel)

        # RIGHT PANEL - Results & Visualization
        right_panel = tk.Frame(paned, bg='#f0f0f0')
        paned.add(right_panel, minsize=750)

        self.setup_right_panel(right_panel)

    def setup_left_panel(self, parent):
        """Setup left control panel"""

        # Title
        title_frame = tk.Frame(parent, bg='#2196F3', pady=15)
        title_frame.pack(fill='x')

        title_label = tk.Label(
            title_frame,
            text="🧪 VLM Testing",
            font=('Arial', 20, 'bold'),
            bg='#2196F3',
            fg='white'
        )
        title_label.pack()

        subtitle_label = tk.Label(
            title_frame,
            text="Professional Analytics Edition",
            font=('Arial', 10),
            bg='#2196F3',
            fg='white'
        )
        subtitle_label.pack()

        # Scrollable container
        canvas = tk.Canvas(parent, bg='#f0f0f0', highlightthickness=0)
        scrollbar = ttk.Scrollbar(parent, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#f0f0f0')

        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )

        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True, padx=10, pady=10)
        scrollbar.pack(side="right", fill="y")

        # API Key Section
        api_frame = tk.LabelFrame(
            scrollable_frame,
            text="🔑 API Configuration",
            font=('Arial', 11, 'bold'),
            bg='white',
            padx=15,
            pady=10
        )
        api_frame.pack(fill='x', pady=(0, 10))

        tk.Label(
            api_frame,
            text="Gemini API Key:",
            font=('Arial', 9),
            bg='white'
        ).pack(anchor='w')

        api_entry = tk.Entry(
            api_frame,
            textvariable=self.api_key_var,
            font=('Arial', 9),
            show='*'
        )
        api_entry.pack(fill='x', pady=(5, 0))

        # Scoring Mode Section
        score_frame = tk.LabelFrame(
            scrollable_frame,
            text="📊 Scoring Mode",
            font=('Arial', 11, 'bold'),
            bg='white',
            padx=15,
            pady=10
        )
        score_frame.pack(fill='x', pady=(0, 10))

        tk.Radiobutton(
            score_frame,
            text="🤖 Auto Scoring (Heuristic-based)",
            variable=self.scoring_mode,
            value='auto',
            font=('Arial', 9),
            bg='white'
        ).pack(anchor='w')

        tk.Radiobutton(
            score_frame,
            text="👤 Manual Scoring (Interactive)",
            variable=self.scoring_mode,
            value='manual',
            font=('Arial', 9),
            bg='white'
        ).pack(anchor='w')

        # Image Selection Section
        image_frame = tk.LabelFrame(
            scrollable_frame,
            text="📷 Image Selection (Max 5 images)",
            font=('Arial', 11, 'bold'),
            bg='white',
            padx=15,
            pady=10
        )
        image_frame.pack(fill='x', pady=(0, 10))

        btn_frame = tk.Frame(image_frame, bg='white')
        btn_frame.pack(fill='x', pady=(0, 10))

        tk.Button(
            btn_frame,
            text="📁 Select Images",
            command=self.select_images,
            font=('Arial', 9, 'bold'),
            bg='#4CAF50',
            fg='white',
            padx=15,
            pady=6,
            cursor='hand2'
        ).pack(side='left', padx=(0, 5))

        tk.Button(
            btn_frame,
            text="📂 Select Folder",
            command=self.select_folder,
            font=('Arial', 9, 'bold'),
            bg='#2196F3',
            fg='white',
            padx=15,
            pady=6,
            cursor='hand2'
        ).pack(side='left', padx=(0, 5))

        tk.Button(
            btn_frame,
            text="🗑️ Clear",
            command=self.clear_images,
            font=('Arial', 9, 'bold'),
            bg='#F44336',
            fg='white',
            padx=15,
            pady=6,
            cursor='hand2'
        ).pack(side='left')

        self.image_listbox = tk.Listbox(
            image_frame,
            height=4,
            font=('Arial', 9),
            bg='#f9f9f9'
        )
        self.image_listbox.pack(fill='both', expand=True)

        # Test Type Selection Section
        test_frame = tk.LabelFrame(
            scrollable_frame,
            text="🎯 Test Types",
            font=('Arial', 11, 'bold'),
            bg='white',
            padx=15,
            pady=10
        )
        test_frame.pack(fill='x', pady=(0, 10))

        test_options_frame = tk.Frame(test_frame, bg='white')
        test_options_frame.pack(fill='x')

        self.test_vars = {
            'classification': tk.BooleanVar(value=True),
            'condition': tk.BooleanVar(value=True),
            'damage': tk.BooleanVar(value=True),
            'description': tk.BooleanVar(value=True)
        }

        test_labels = {
            'classification': '🏛️ Classification',
            'condition': '📊 Condition',
            'damage': '🔍 Damage Analysis',
            'description': '📝 Description'
        }

        for i, (key, var) in enumerate(self.test_vars.items()):
            cb = tk.Checkbutton(
                test_options_frame,
                text=test_labels[key],
                variable=var,
                font=('Arial', 9),
                bg='white'
            )
            cb.grid(row=i//2, column=i%2, sticky='w', padx=5, pady=3)

        # Control Buttons
        control_frame = tk.Frame(scrollable_frame, bg='#f0f0f0')
        control_frame.pack(fill='x', pady=(0, 10))

        self.start_button = tk.Button(
            control_frame,
            text="🚀 START TESTING",
            command=self.start_testing,
            font=('Arial', 12, 'bold'),
            bg='#FF9800',
            fg='white',
            padx=20,
            pady=10,
            cursor='hand2'
        )
        self.start_button.pack(fill='x', pady=(0, 5))

        self.stop_button = tk.Button(
            control_frame,
            text="⏹️ STOP",
            command=self.stop_testing,
            font=('Arial', 11, 'bold'),
            bg='#9E9E9E',
            fg='white',
            padx=20,
            pady=8,
            cursor='hand2',
            state='disabled'
        )
        self.stop_button.pack(fill='x', pady=(0, 5))

        tk.Button(
            control_frame,
            text="📁 Open Results Folder",
            command=self.open_results_folder,
            font=('Arial', 10, 'bold'),
            bg='#00BCD4',
            fg='white',
            padx=20,
            pady=8,
            cursor='hand2'
        ).pack(fill='x')

        # Progress Section
        progress_frame = tk.LabelFrame(
            scrollable_frame,
            text="📊 Progress",
            font=('Arial', 11, 'bold'),
            bg='white',
            padx=15,
            pady=10
        )
        progress_frame.pack(fill='both', expand=True)

        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(
            progress_frame,
            variable=self.progress_var,
            maximum=100,
            mode='determinate'
        )
        self.progress_bar.pack(fill='x', pady=(0, 10))

        self.status_label = tk.Label(
            progress_frame,
            text="Ready to start testing",
            font=('Arial', 9),
            bg='white',
            fg='#666'
        )
        self.status_label.pack(anchor='w')

        # Log Section
        self.log_text = scrolledtext.ScrolledText(
            progress_frame,
            height=8,
            font=('Consolas', 8),
            bg='#1e1e1e',
            fg='#d4d4d4',
            wrap='word'
        )
        self.log_text.pack(fill='both', expand=True, pady=(10, 0))

        # Configure log text tags
        self.log_text.tag_config('success', foreground='#4CAF50')
        self.log_text.tag_config('error', foreground='#F44336')
        self.log_text.tag_config('info', foreground='#2196F3')
        self.log_text.tag_config('warning', foreground='#FF9800')

    def setup_right_panel(self, parent):
        """Setup right results panel"""

        # Title
        title_frame = tk.Frame(parent, bg='#9C27B0', pady=15)
        title_frame.pack(fill='x')

        title_label = tk.Label(
            title_frame,
            text="📊 Results & Analytics",
            font=('Arial', 20, 'bold'),
            bg='#9C27B0',
            fg='white'
        )
        title_label.pack()

        # Notebook for tabs
        self.notebook = ttk.Notebook(parent)
        self.notebook.pack(fill='both', expand=True, padx=10, pady=10)

        # Tab 1: Summary
        self.summary_tab = tk.Frame(self.notebook, bg='white')
        self.notebook.add(self.summary_tab, text='📋 Summary')
        self.setup_summary_tab()

        # Tab 2: Detailed Results
        self.results_tab = tk.Frame(self.notebook, bg='white')
        self.notebook.add(self.results_tab, text='📊 Detailed Results')
        self.setup_results_tab()

        # Tab 3: Visualizations
        self.viz_tab = tk.Frame(self.notebook, bg='white')
        self.notebook.add(self.viz_tab, text='📈 Visualizations')
        self.setup_viz_tab()

        # Tab 4: Report
        self.report_tab = tk.Frame(self.notebook, bg='white')
        self.notebook.add(self.report_tab, text='📄 Report')
        self.setup_report_tab()

    def setup_summary_tab(self):
        """Setup summary tab"""
        self.summary_text = scrolledtext.ScrolledText(
            self.summary_tab,
            font=('Consolas', 10),
            bg='#f9f9f9',
            wrap='word'
        )
        self.summary_text.pack(fill='both', expand=True, padx=10, pady=10)

        self.summary_text.insert('1.0', "📊 Run tests to see summary statistics here...\n\n")
        self.summary_text.insert('end', "Metrics will include:\n")
        self.summary_text.insert('end', "• Overall Accuracy Score\n")
        self.summary_text.insert('end', "• Success Rate\n")
        self.summary_text.insert('end', "• Average Processing Time\n")
        self.summary_text.insert('end', "• Scores by Category\n")
        self.summary_text.insert('end', "• Grade & Recommendations\n")
        self.summary_text.config(state='disabled')

    def setup_results_tab(self):
        """Setup detailed results tab"""
        # Treeview for results table
        columns = ('Image', 'Test Type', 'Status', 'Score', 'Time (s)')
        self.results_tree = ttk.Treeview(self.results_tab, columns=columns, show='headings', height=15)

        for col in columns:
            self.results_tree.heading(col, text=col)
            self.results_tree.column(col, width=120)

        # Scrollbar
        scrollbar = ttk.Scrollbar(self.results_tab, orient='vertical', command=self.results_tree.yview)
        self.results_tree.configure(yscrollcommand=scrollbar.set)

        self.results_tree.pack(side='left', fill='both', expand=True, padx=(10, 0), pady=10)
        scrollbar.pack(side='right', fill='y', pady=10, padx=(0, 10))

    def setup_viz_tab(self):
        """Setup visualization tab"""
        self.viz_canvas_frame = tk.Frame(self.viz_tab, bg='white')
        self.viz_canvas_frame.pack(fill='both', expand=True, padx=10, pady=10)

        placeholder = tk.Label(
            self.viz_canvas_frame,
            text="📈 Visualizations will appear here after testing...",
            font=('Arial', 14),
            bg='white',
            fg='#999'
        )
        placeholder.pack(expand=True)

    def setup_report_tab(self):
        """Setup report tab"""
        self.report_text = scrolledtext.ScrolledText(
            self.report_tab,
            font=('Consolas', 9),
            bg='#f9f9f9',
            wrap='word'
        )
        self.report_text.pack(fill='both', expand=True, padx=10, pady=10)

        self.report_text.insert('1.0', "📄 Detailed markdown report will be generated here after testing...")
        self.report_text.config(state='disabled')

    def log(self, message, tag='info'):
        """Add message to log"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        self.log_text.insert('end', f"[{timestamp}] {message}\n", tag)
        self.log_text.see('end')
        self.root.update()

    def select_images(self):
        """Select individual images"""
        files = filedialog.askopenfilenames(
            title="Select Images (Max 5)",
            filetypes=[
                ("Image files", "*.jpg *.jpeg *.png *.bmp *.gif *.webp"),
                ("All files", "*.*")
            ]
        )

        if files:
            remaining_slots = 5 - len(self.image_paths)
            if remaining_slots <= 0:
                messagebox.showwarning("Limit Reached", "Maximum 5 images allowed. Clear the list first.")
                return

            files_to_add = list(files)[:remaining_slots]
            self.image_paths.extend(files_to_add)
            self.update_image_list()

            if len(files) > remaining_slots:
                messagebox.showinfo("Info", f"Only first {remaining_slots} images were added (limit: 5 images)")

    def select_folder(self):
        """Select folder and get first 5 images"""
        folder = filedialog.askdirectory(title="Select Folder")

        if folder:
            folder_path = Path(folder)
            extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.gif', '*.webp']
            images = []

            for ext in extensions:
                images.extend(folder_path.glob(ext))
                images.extend(folder_path.glob(ext.upper()))

            if not images:
                messagebox.showwarning("No Images", "No images found in selected folder.")
                return

            images = images[:5]
            self.image_paths = [str(img) for img in images]
            self.update_image_list()

            messagebox.showinfo("Success", f"Loaded {len(self.image_paths)} images from folder.")

    def clear_images(self):
        """Clear image list"""
        self.image_paths = []
        self.update_image_list()

    def update_image_list(self):
        """Update image listbox"""
        self.image_listbox.delete(0, 'end')
        for img in self.image_paths:
            self.image_listbox.insert('end', Path(img).name)

    def start_testing(self):
        """Start the testing process"""
        if not self.api_key_var.get().strip():
            messagebox.showerror("Error", "Please enter Gemini API Key")
            return

        if not self.image_paths:
            messagebox.showerror("Error", "Please select at least one image")
            return

        selected_tests = [k for k, v in self.test_vars.items() if v.get()]
        if not selected_tests:
            messagebox.showerror("Error", "Please select at least one test type")
            return

        self.test_types = selected_tests

        # Disable start button
        self.start_button.config(state='disabled')
        self.stop_button.config(state='normal')
        self.is_testing = True

        # Clear previous results
        self.results = []
        self.scores = []
        self.progress_var.set(0)
        self.log_text.delete(1.0, 'end')

        # Clear results tree
        for item in self.results_tree.get_children():
            self.results_tree.delete(item)

        # Start testing in thread
        thread = threading.Thread(target=self.run_tests, daemon=True)
        thread.start()

    def stop_testing(self):
        """Stop the testing process"""
        self.is_testing = False
        self.log("⏹️ Testing stopped by user", 'warning')
        self.start_button.config(state='normal')
        self.stop_button.config(state='disabled')

    def run_tests(self):
        """Run all tests"""
        try:
            self.log("🚀 Initializing VLM Accuracy Testing System...", 'info')

            # Configure API
            genai.configure(api_key=self.api_key_var.get())
            model = genai.GenerativeModel(self.model_name)

            self.log(f"✅ Connected to {self.model_name}", 'success')

            total_tests = len(self.image_paths) * len(self.test_types)
            current_test = 0

            # Process each image
            for img_idx, image_path in enumerate(self.image_paths):
                if not self.is_testing:
                    break

                img_name = Path(image_path).name
                self.log(f"\n📷 Processing image {img_idx + 1}/{len(self.image_paths)}: {img_name}", 'info')

                try:
                    image = Image.open(image_path)
                except Exception as e:
                    self.log(f"❌ Failed to load image: {str(e)}", 'error')
                    continue

                # Run each test type
                for test_type in self.test_types:
                    if not self.is_testing:
                        break

                    current_test += 1
                    progress = (current_test / total_tests) * 100
                    self.progress_var.set(progress)

                    self.log(f"  🎯 Running {test_type} test...", 'info')
                    self.status_label.config(text=f"Testing {img_name} - {test_type}")

                    try:
                        result = self.analyze_image(model, image, image_path, test_type)

                        if result['success']:
                            # Calculate scores
                            scores = self.calculate_scores(result)
                            result['scores'] = scores

                            self.log(f"  ✅ {test_type}: Success (Score: {scores['overall']:.1f}/10)", 'success')
                            self.results.append(result)
                            self.scores.append(scores)

                            # Add to tree
                            self.results_tree.insert('', 'end', values=(
                                img_name,
                                test_type,
                                '✅ Success',
                                f"{scores['overall']:.1f}",
                                f"{result.get('processing_time', 0):.2f}"
                            ))
                        else:
                            self.log(f"  ❌ {test_type}: Failed - {result.get('error', 'Unknown')}", 'error')
                            self.results_tree.insert('', 'end', values=(
                                img_name,
                                test_type,
                                '❌ Failed',
                                'N/A',
                                'N/A'
                            ))

                    except Exception as e:
                        self.log(f"  ❌ {test_type}: Error - {str(e)}", 'error')

                    time.sleep(0.3)

            if self.is_testing:
                self.progress_var.set(100)
                self.log("\n🎉 Testing completed!", 'success')

                # Generate analytics
                self.generate_analytics()

                # Save results
                self.save_results()

                messagebox.showinfo("Success",
                    f"Testing completed!\n\n"
                    f"Processed: {len(self.image_paths)} images\n"
                    f"Total tests: {len(self.results)}\n"
                    f"Success rate: {self.calculate_success_rate():.1f}%")

        except Exception as e:
            self.log(f"\n❌ Critical Error: {str(e)}", 'error')
            messagebox.showerror("Error", f"Testing failed: {str(e)}")

        finally:
            self.start_button.config(state='normal')
            self.stop_button.config(state='disabled')
            self.is_testing = False
            self.status_label.config(text="Testing finished")

    def analyze_image(self, model, image, image_path, test_type):
        """Analyze single image"""
        prompt = self.get_prompt(test_type)

        result = {
            'image': Path(image_path).name,
            'test_type': test_type,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'success': False
        }

        try:
            start_time = time.time()
            response = model.generate_content([prompt, image])
            processing_time = time.time() - start_time

            result['processing_time'] = processing_time
            result['raw_response'] = response.text
            result['word_count'] = len(response.text.split())
            result['success'] = True

            # Parse response
            self.parse_response(result, test_type)

        except Exception as e:
            result['error'] = str(e)
            result['success'] = False

        return result

    def get_prompt(self, test_type):
        """Get prompt for test type"""
        prompts = {
            'classification': """Analisis gambar ini dan identifikasi jenis objek cultural heritage:

FORMAT RESPONSE:
TYPE: [candi/patung/relief/artefak]
CERTAINTY: [high/medium/low]
CONFIDENCE_SCORE: [0-100]
REASONING: [penjelasan detail mengapa objek diklasifikasikan demikian]

DETAILS:
- Karakteristik visual utama
- Ciri khas yang mendukung klasifikasi
- Perbandingan dengan tipe objek lain""",

            'condition': """Evaluasi kondisi objek cultural heritage:

FORMAT RESPONSE:
CONDITION: [excellent/good/fair/poor]
STRUCTURAL_INTEGRITY: [intact/stable/damaged/critical]
PRESERVATION_STATE: [well-preserved/moderate/deteriorated/severe]
CONDITION_SCORE: [0-100]

ASSESSMENT:
- Detail kondisi keseluruhan
- Area yang perlu perhatian
- Tingkat prioritas preservasi""",

            'damage': """Analisis kerusakan pada objek cultural heritage:

FORMAT RESPONSE:
DAMAGE_LEVEL: [minimal/low/moderate/high/severe]
SEVERITY_SCORE: [0-10]
DAMAGE_TYPES: [list jenis kerusakan yang teridentifikasi]
AFFECTED_AREAS: [area yang terkena dampak]
URGENCY: [low/medium/high/critical]

DETAILS:
- Deskripsi detail setiap kerusakan
- Penyebab yang mungkin
- Rekomendasi tindakan""",

            'description': """Berikan deskripsi komprehensif objek cultural heritage:

FORMAT RESPONSE:
OVERVIEW: [deskripsi umum singkat]
VISUAL_FEATURES: [karakteristik visual menonjol]
ARCHITECTURAL_STYLE: [gaya arsitektur/artistik]
MATERIALS: [material yang digunakan]
NOTABLE_ELEMENTS: [elemen menarik]
HISTORICAL_CONTEXT: [konteks historis jika bisa diidentifikasi]

Berikan analisis yang detail dan komprehensif."""
        }

        return prompts.get(test_type, "Describe this image in detail.")

    def parse_response(self, result, test_type):
        """Parse VLM response"""
        text = result['raw_response']
        lines = text.split('\n')
        parsed = {}

        for line in lines:
            if ':' in line:
                parts = line.split(':', 1)
                if len(parts) == 2:
                    key = parts[0].strip().lower().replace(' ', '_')
                    value = parts[1].strip()
                    parsed[key] = value

        result['parsed'] = parsed

        # Extract confidence/scores from parsed data
        confidence = 70  # default

        # Try to extract confidence from various fields
        for key in ['confidence_score', 'condition_score', 'severity_score']:
            if key in parsed:
                try:
                    val = re.search(r'\d+', parsed[key])
                    if val:
                        confidence = int(val.group())
                        break
                except:
                    pass

        result['confidence'] = confidence

    def calculate_scores(self, result):
        """Calculate scores for result"""
        scores = {}

        # Base score from confidence
        base_score = result.get('confidence', 70) / 10

        # Completeness score based on word count
        word_count = result.get('word_count', 0)
        completeness = min((word_count / 50) * 3, 10)  # Max 10 at 150+ words

        # Relevance - check for key information
        relevance = 7.0  # default
        text_lower = result['raw_response'].lower()

        keywords = ['kondisi', 'kerusakan', 'analisis', 'detail', 'rekomendasi',
                   'condition', 'damage', 'analysis', 'preservation']
        keyword_count = sum(1 for kw in keywords if kw in text_lower)
        relevance += min(keyword_count * 0.3, 3.0)

        # Detail quality
        detail = 6.0
        if word_count > 100:
            detail += 2
        if word_count > 200:
            detail += 2

        # Structure score - has formatted sections
        structure = 7.0
        if 'FORMAT' in result['raw_response'] or len(result.get('parsed', {})) > 3:
            structure += 2
        if any(header in result['raw_response'] for header in ['DETAIL', 'ASSESSMENT', 'OVERVIEW']):
            structure += 1

        scores['correctness'] = min(base_score, 10)
        scores['completeness'] = min(completeness, 10)
        scores['relevance'] = min(relevance, 10)
        scores['detail_quality'] = min(detail, 10)
        scores['structure'] = min(structure, 10)

        # Overall score (weighted average)
        scores['overall'] = (
            scores['correctness'] * 0.3 +
            scores['completeness'] * 0.25 +
            scores['relevance'] * 0.2 +
            scores['detail_quality'] * 0.15 +
            scores['structure'] * 0.1
        )

        return scores

    def calculate_success_rate(self):
        """Calculate success rate"""
        if not self.results:
            return 0
        successful = sum(1 for r in self.results if r.get('success', False))
        return (successful / len(self.results)) * 100

    def generate_analytics(self):
        """Generate analytics and visualizations"""
        if not self.results or not self.scores:
            return

        self.log("📊 Generating analytics...", 'info')

        # Update summary
        self.update_summary()

        # Generate visualizations
        self.generate_visualizations()

        # Generate report
        self.generate_report()

        self.log("✅ Analytics generated!", 'success')

    def update_summary(self):
        """Update summary tab"""
        self.summary_text.config(state='normal')
        self.summary_text.delete(1.0, 'end')

        # Calculate statistics
        df_scores = pd.DataFrame(self.scores)
        avg_overall = df_scores['overall'].mean()
        grade = self.get_grade(avg_overall)

        success_count = sum(1 for r in self.results if r['success'])
        total_count = len(self.results)
        success_rate = (success_count / total_count * 100) if total_count > 0 else 0

        avg_time = np.mean([r.get('processing_time', 0) for r in self.results if r.get('success')])

        # Write summary
        self.summary_text.insert('end', "="*60 + "\n")
        self.summary_text.insert('end', "🏆 VLM ACCURACY TEST - SUMMARY REPORT\n")
        self.summary_text.insert('end', "="*60 + "\n\n")

        self.summary_text.insert('end', f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        self.summary_text.insert('end', f"🤖 Model: {self.model_name}\n")
        self.summary_text.insert('end', f"📷 Images Tested: {len(self.image_paths)}\n")
        self.summary_text.insert('end', f"🎯 Test Types: {', '.join(self.test_types)}\n\n")

        self.summary_text.insert('end', "-"*60 + "\n")
        self.summary_text.insert('end', "📊 OVERALL PERFORMANCE\n")
        self.summary_text.insert('end', "-"*60 + "\n\n")

        self.summary_text.insert('end', f"🎯 Overall Score: {avg_overall:.2f}/10\n")
        self.summary_text.insert('end', f"🏆 Grade: {grade} {self.get_grade_emoji(grade)}\n")
        self.summary_text.insert('end', f"✅ Success Rate: {success_rate:.1f}% ({success_count}/{total_count})\n")
        self.summary_text.insert('end', f"⏱️  Avg Processing Time: {avg_time:.2f}s\n\n")

        self.summary_text.insert('end', "-"*60 + "\n")
        self.summary_text.insert('end', "📈 SCORES BY CATEGORY\n")
        self.summary_text.insert('end', "-"*60 + "\n\n")

        for metric in ['correctness', 'completeness', 'relevance', 'detail_quality', 'structure']:
            avg_score = df_scores[metric].mean()
            self.summary_text.insert('end', f"  • {metric.replace('_', ' ').title()}: {avg_score:.2f}/10\n")

        self.summary_text.insert('end', "\n" + "-"*60 + "\n")
        self.summary_text.insert('end', "💡 VERDICT\n")
        self.summary_text.insert('end', "-"*60 + "\n\n")
        self.summary_text.insert('end', self.get_verdict(grade, avg_overall) + "\n")

        self.summary_text.config(state='disabled')

    def generate_visualizations(self):
        """Generate visualization charts"""
        # Clear previous
        for widget in self.viz_canvas_frame.winfo_children():
            widget.destroy()

        if not self.scores:
            return

        df_scores = pd.DataFrame(self.scores)

        # Create figure with subplots
        fig = plt.figure(figsize=(12, 10))
        fig.suptitle('📊 VLM Accuracy Test - Analytics Dashboard',
                     fontsize=16, fontweight='bold', y=0.98)

        # 1. Overall Scores Bar Chart
        ax1 = plt.subplot(2, 2, 1)
        metrics = ['correctness', 'completeness', 'relevance', 'detail_quality', 'structure']
        avg_scores = [df_scores[m].mean() for m in metrics]
        colors_list = [COLORS['success'], COLORS['info'], COLORS['warning'],
                      COLORS['purple'], COLORS['teal']]

        bars = ax1.barh(metrics, avg_scores, color=colors_list)
        ax1.set_xlim(0, 10)
        ax1.set_xlabel('Score (0-10)', fontweight='bold')
        ax1.set_title('📊 Average Scores by Category', fontweight='bold', pad=10)
        ax1.grid(axis='x', alpha=0.3)

        # Add value labels
        for i, (bar, score) in enumerate(zip(bars, avg_scores)):
            ax1.text(score + 0.2, i, f'{score:.2f}', va='center', fontweight='bold')

        # 2. Score Distribution
        ax2 = plt.subplot(2, 2, 2)
        overall_scores = df_scores['overall'].values
        ax2.hist(overall_scores, bins=10, color=COLORS['primary'], alpha=0.7, edgecolor='black')
        ax2.axvline(overall_scores.mean(), color='red', linestyle='--', linewidth=2,
                   label=f'Mean: {overall_scores.mean():.2f}')
        ax2.set_xlabel('Overall Score', fontweight='bold')
        ax2.set_ylabel('Frequency', fontweight='bold')
        ax2.set_title('📈 Score Distribution', fontweight='bold', pad=10)
        ax2.legend()
        ax2.grid(alpha=0.3)

        # 3. Success Rate Pie
        ax3 = plt.subplot(2, 2, 3)
        success_count = sum(1 for r in self.results if r['success'])
        fail_count = len(self.results) - success_count

        if fail_count > 0:
            ax3.pie([success_count, fail_count],
                   labels=['✅ Success', '❌ Failed'],
                   autopct='%1.1f%%',
                   colors=[COLORS['success'], COLORS['danger']],
                   startangle=90)
        else:
            ax3.pie([success_count],
                   labels=['✅ Success'],
                   colors=[COLORS['success']],
                   startangle=90)

        ax3.set_title('✅ Success Rate', fontweight='bold', pad=10)

        # 4. Processing Time
        ax4 = plt.subplot(2, 2, 4)
        times = [r.get('processing_time', 0) for r in self.results if r.get('success')]
        if times:
            ax4.boxplot(times, vert=True, patch_artist=True,
                       boxprops=dict(facecolor=COLORS['info'], alpha=0.7),
                       medianprops=dict(color='red', linewidth=2))
            ax4.set_ylabel('Time (seconds)', fontweight='bold')
            ax4.set_title('⏱️ Processing Time Distribution', fontweight='bold', pad=10)
            ax4.grid(alpha=0.3)

            # Add stats
            avg_time = np.mean(times)
            ax4.text(1.15, avg_time, f'Avg: {avg_time:.2f}s',
                    fontweight='bold', va='center')

        plt.tight_layout()

        # Embed in tkinter
        canvas = FigureCanvasTkAgg(fig, master=self.viz_canvas_frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill='both', expand=True)

    def generate_report(self):
        """Generate detailed markdown report"""
        self.report_text.config(state='normal')
        self.report_text.delete(1.0, 'end')

        if not self.results:
            self.report_text.insert('1.0', "No results to report.")
            self.report_text.config(state='disabled')
            return

        df_scores = pd.DataFrame(self.scores)
        avg_overall = df_scores['overall'].mean()
        grade = self.get_grade(avg_overall)

        # Build report
        report = f"""# 🧪 VLM ACCURACY TEST - DETAILED REPORT

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Model:** {self.model_name}
**Images Tested:** {len(self.image_paths)}
**Test Types:** {', '.join(self.test_types)}

---

## 📊 EXECUTIVE SUMMARY

- **Overall Score:** {avg_overall:.2f}/10
- **Grade:** {grade} {self.get_grade_emoji(grade)}
- **Success Rate:** {self.calculate_success_rate():.1f}%

---

## 📈 DETAILED METRICS

### Average Scores by Category

| Category | Score | Grade |
|----------|-------|-------|
| Correctness | {df_scores['correctness'].mean():.2f}/10 | {self.get_grade(df_scores['correctness'].mean())} |
| Completeness | {df_scores['completeness'].mean():.2f}/10 | {self.get_grade(df_scores['completeness'].mean())} |
| Relevance | {df_scores['relevance'].mean():.2f}/10 | {self.get_grade(df_scores['relevance'].mean())} |
| Detail Quality | {df_scores['detail_quality'].mean():.2f}/10 | {self.get_grade(df_scores['detail_quality'].mean())} |
| Structure | {df_scores['structure'].mean():.2f}/10 | {self.get_grade(df_scores['structure'].mean())} |

---

## 💡 VERDICT

{self.get_verdict(grade, avg_overall)}

---

## 📝 INDIVIDUAL TEST RESULTS

"""

        for i, result in enumerate(self.results, 1):
            if result.get('success'):
                scores = result.get('scores', {})
                report += f"""
### Test #{i}: {result['image']} - {result['test_type']}

- **Status:** ✅ Success
- **Overall Score:** {scores.get('overall', 0):.2f}/10
- **Processing Time:** {result.get('processing_time', 0):.2f}s
- **Word Count:** {result.get('word_count', 0)} words

**Scores:**
- Correctness: {scores.get('correctness', 0):.2f}/10
- Completeness: {scores.get('completeness', 0):.2f}/10
- Relevance: {scores.get('relevance', 0):.2f}/10

---
"""
            else:
                report += f"""
### Test #{i}: {result['image']} - {result['test_type']}

- **Status:** ❌ Failed
- **Error:** {result.get('error', 'Unknown error')}

---
"""

        report += f"""

## 📁 FILES GENERATED

1. **Results JSON** - Raw test results data
2. **Visualizations PNG** - Charts and graphs
3. **This Report** - Comprehensive analysis

---

**End of Report**

🤖 Generated by VLM Accuracy Testing System
💻 CureVa Team - Professional Edition v2.0
"""

        self.report_text.insert('1.0', report)
        self.report_text.config(state='disabled')

    def get_grade(self, score):
        """Get letter grade from score"""
        if score >= 9:
            return 'A+'
        elif score >= 8:
            return 'A'
        elif score >= 7:
            return 'B+'
        elif score >= 6:
            return 'B'
        elif score >= 5:
            return 'C'
        else:
            return 'D'

    def get_grade_emoji(self, grade):
        """Get emoji for grade"""
        emoji_map = {
            'A+': '🏆',
            'A': '⭐',
            'B+': '✨',
            'B': '👍',
            'C': '⚠️',
            'D': '❌'
        }
        return emoji_map.get(grade, '📊')

    def get_verdict(self, grade, score):
        """Get verdict based on grade"""
        verdicts = {
            'A+': f"🌟 **OUTSTANDING!** VLM menunjukkan performa luar biasa dengan score {score:.2f}/10. Model sangat reliable untuk production use.",
            'A': f"⭐ **EXCELLENT!** VLM performa sangat baik dengan score {score:.2f}/10. Highly reliable dan siap deployment.",
            'B+': f"✨ **GOOD!** VLM performa baik dengan score {score:.2f}/10. Cukup reliable dengan minor improvements.",
            'B': f"👍 **DECENT** VLM performa decent dengan score {score:.2f}/10. Dapat digunakan dengan beberapa improvements.",
            'C': f"⚠️ **NEEDS IMPROVEMENT** VLM score {score:.2f}/10. Perlu significant improvement sebelum production.",
            'D': f"❌ **REQUIRES WORK** VLM score {score:.2f}/10. Memerlukan major improvements."
        }
        return verdicts.get(grade, f"Score: {score:.2f}/10")

    def save_results(self):
        """Save results to files"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # Save JSON results
        json_file = self.output_folder / f"vlm_results_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump({
                'results': self.results,
                'scores': self.scores,
                'summary': {
                    'total_tests': len(self.results),
                    'success_rate': self.calculate_success_rate(),
                    'avg_score': pd.DataFrame(self.scores)['overall'].mean() if self.scores else 0
                }
            }, f, indent=2, ensure_ascii=False)

        self.log(f"💾 Results saved: {json_file.name}", 'success')

        # Save report
        report_file = self.output_folder / f"vlm_report_{timestamp}.md"
        self.report_text.config(state='normal')
        report_content = self.report_text.get(1.0, 'end-1c')
        self.report_text.config(state='disabled')

        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report_content)

        self.log(f"📄 Report saved: {report_file.name}", 'success')

        # Save visualization
        if self.scores:
            self.save_visualization_chart(timestamp)

    def save_visualization_chart(self, timestamp):
        """Save visualization chart to file"""
        try:
            df_scores = pd.DataFrame(self.scores)

            fig = plt.figure(figsize=(14, 11))
            fig.suptitle('📊 VLM Accuracy Test - Complete Analytics Dashboard',
                        fontsize=18, fontweight='bold', y=0.98)

            # 1. Overall Scores Bar Chart
            ax1 = plt.subplot(2, 2, 1)
            metrics = ['correctness', 'completeness', 'relevance', 'detail_quality', 'structure']
            avg_scores = [df_scores[m].mean() for m in metrics]
            colors_list = [COLORS['success'], COLORS['info'], COLORS['warning'],
                          COLORS['purple'], COLORS['teal']]

            bars = ax1.barh(metrics, avg_scores, color=colors_list)
            ax1.set_xlim(0, 10)
            ax1.set_xlabel('Score (0-10)', fontweight='bold', fontsize=11)
            ax1.set_title('📊 Average Scores by Category', fontweight='bold', pad=10, fontsize=12)
            ax1.grid(axis='x', alpha=0.3)

            for i, (bar, score) in enumerate(zip(bars, avg_scores)):
                ax1.text(score + 0.2, i, f'{score:.2f}', va='center', fontweight='bold', fontsize=10)

            # 2. Score Distribution
            ax2 = plt.subplot(2, 2, 2)
            overall_scores = df_scores['overall'].values
            ax2.hist(overall_scores, bins=10, color=COLORS['primary'], alpha=0.7, edgecolor='black')
            ax2.axvline(overall_scores.mean(), color='red', linestyle='--', linewidth=2,
                       label=f'Mean: {overall_scores.mean():.2f}')
            ax2.set_xlabel('Overall Score', fontweight='bold', fontsize=11)
            ax2.set_ylabel('Frequency', fontweight='bold', fontsize=11)
            ax2.set_title('📈 Score Distribution', fontweight='bold', pad=10, fontsize=12)
            ax2.legend()
            ax2.grid(alpha=0.3)

            # 3. Success Rate Pie
            ax3 = plt.subplot(2, 2, 3)
            success_count = sum(1 for r in self.results if r['success'])
            fail_count = len(self.results) - success_count

            if fail_count > 0:
                wedges, texts, autotexts = ax3.pie([success_count, fail_count],
                       labels=['✅ Success', '❌ Failed'],
                       autopct='%1.1f%%',
                       colors=[COLORS['success'], COLORS['danger']],
                       startangle=90,
                       textprops={'fontsize': 11, 'fontweight': 'bold'})
            else:
                wedges, texts, autotexts = ax3.pie([success_count],
                       labels=['✅ Success'],
                       colors=[COLORS['success']],
                       startangle=90,
                       textprops={'fontsize': 11, 'fontweight': 'bold'})

            ax3.set_title('✅ Success Rate', fontweight='bold', pad=10, fontsize=12)

            # 4. Processing Time
            ax4 = plt.subplot(2, 2, 4)
            times = [r.get('processing_time', 0) for r in self.results if r.get('success')]
            if times:
                bp = ax4.boxplot(times, vert=True, patch_artist=True,
                           boxprops=dict(facecolor=COLORS['info'], alpha=0.7),
                           medianprops=dict(color='red', linewidth=2))
                ax4.set_ylabel('Time (seconds)', fontweight='bold', fontsize=11)
                ax4.set_title('⏱️ Processing Time Distribution', fontweight='bold', pad=10, fontsize=12)
                ax4.grid(alpha=0.3)

                avg_time = np.mean(times)
                min_time = np.min(times)
                max_time = np.max(times)

                stats_text = f'Avg: {avg_time:.2f}s\nMin: {min_time:.2f}s\nMax: {max_time:.2f}s'
                ax4.text(1.25, avg_time, stats_text,
                        fontweight='bold', va='center', fontsize=9,
                        bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

            plt.tight_layout()

            # Save chart
            viz_file = self.output_folder / f"vlm_charts_{timestamp}.png"
            plt.savefig(viz_file, dpi=150, bbox_inches='tight', facecolor='white')
            plt.close(fig)

            self.log(f"📊 Charts saved: {viz_file.name}", 'success')

        except Exception as e:
            self.log(f"⚠️ Failed to save chart: {str(e)}", 'warning')

    def open_results_folder(self):
        """Open results folder"""
        import subprocess

        try:
            if os.name == 'nt':  # Windows
                os.startfile(self.output_folder)
            elif os.name == 'posix':
                subprocess.run(['open' if os.uname().sysname == 'Darwin' else 'xdg-open',
                              self.output_folder])
            self.log(f"📁 Opened: {self.output_folder}", 'info')
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open folder: {str(e)}")

def main():
    root = tk.Tk()
    app = VLMAccuracyTesterGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()

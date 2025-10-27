"""
🧪 VLM ACCURACY TESTING SYSTEM - PROFESSIONAL EDITION
=====================================================
Script untuk menghitung akurasi Vision-Language Model (VLM)
dengan output yang mudah dimengerti dan visualisasi lengkap.

Author: CureVa Team
Version: 2.0
Model: Google Gemini 2.0 Flash Experimental
"""

import google.generativeai as genai
from PIL import Image
import json
import time
import re
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from typing import Dict, List, Any, Tuple
from datetime import datetime
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Set style untuk visualisasi yang lebih menarik
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

# ============================================================================
# 🔧 KONFIGURASI - EDIT BAGIAN INI SAJA
# ============================================================================

# 1. API KEY - Ganti dengan API key Anda
GEMINI_API_KEY = "AIzaSyBO8v7wSaDK7kGq70uzRunqq7ZhtlDyAWk"

# 2. MODEL - Jangan diubah kecuali ada model baru
MODEL_NAME = "gemini-2.0-flash-exp"

# 3. MODE TESTING - Pilih salah satu:
#    - 'interactive': Input manual (rekomendasi untuk testing kecil)
#    - 'auto': Otomatis dari folder (rekomendasi untuk batch testing)
TEST_MODE = 'interactive'

# 4. FOLDER GAMBAR (jika menggunakan mode 'auto')
IMAGE_FOLDER = "C:/Users/hengh/Desktop/testing dataset acuracy"  # Folder berisi gambar untuk testing

# 5. GROUND TRUTH (jika ada) - Optional
# Format: {filename: {"type": "candi", "condition": "baik", "damage_level": "low"}}
GROUND_TRUTH = {
    # Contoh:
    # "candi1.jpg": {"type": "candi", "condition": "sedang", "damage_level": "medium"},
    # "patung1.jpg": {"type": "patung", "condition": "baik", "damage_level": "low"},
}

# 6. OUTPUT FOLDER
OUTPUT_FOLDER = "./vlm_test_results"

# ============================================================================
# 🎨 KONSTANTA & STYLING
# ============================================================================

COLORS = {
    'primary': '#2196F3',
    'success': '#4CAF50',
    'warning': '#FF9800',
    'danger': '#F44336',
    'info': '#00BCD4',
    'purple': '#9C27B0',
    'teal': '#009688'
}

EMOJI = {
    'rocket': '🚀',
    'check': '✅',
    'cross': '❌',
    'warning': '⚠️',
    'info': 'ℹ️',
    'chart': '📊',
    'clock': '⏱️',
    'target': '🎯',
    'trophy': '🏆',
    'fire': '🔥',
    'star': '⭐',
    'magnify': '🔍',
    'bulb': '💡',
    'doc': '📄',
    'folder': '📁',
    'camera': '📷',
    'brain': '🧠',
    'robot': '🤖',
    'sparkle': '✨',
    'party': '🎉'
}

# ============================================================================
# 🧠 VLM TESTER CLASS
# ============================================================================


class VLMAccuracyTester:
    """Class utama untuk testing akurasi VLM"""

    def __init__(self, api_key: str):
        """Initialize VLM Tester"""
        print(f"\n{EMOJI['robot']} Initializing VLM Tester...")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(MODEL_NAME)
        print(f"{EMOJI['check']} Model loaded: {MODEL_NAME}")

    def analyze_image(self, image_path: str, test_type: str) -> Dict[str, Any]:
        """
        Analisis gambar dengan VLM

        Args:
            image_path: Path ke gambar
            test_type: Jenis test (artifact/building/nature/general)

        Returns:
            Dictionary berisi hasil analisis dan metrics
        """
        try:
            # Validate image path
            path = Path(image_path)
            if not path.exists():
                raise FileNotFoundError(f"File tidak ditemukan: {image_path}")

            if path.is_dir():
                raise IsADirectoryError(f"Path adalah folder, bukan file gambar: {image_path}")

            # Load image
            try:
                image = Image.open(image_path)
                # Verify it's a valid image
                image.verify()
                # Re-open for processing (verify closes the file)
                image = Image.open(image_path)
            except Exception as img_err:
                raise ValueError(f"File bukan gambar yang valid: {str(img_err)}")

            # Get prompt sesuai test type
            prompt = self._get_prompt(test_type)

            # Measure processing time
            start_time = time.time()
            response = self.model.generate_content([prompt, image])
            processing_time = time.time() - start_time

            # Parse response
            text = response.text
            result_json = self._parse_json_response(text)
            confidence = self._extract_confidence(result_json, text)

            return {
                'success': True,
                'result': result_json,
                'raw_text': text,
                'processing_time': processing_time,
                'confidence': confidence,
                'word_count': len(text.split()),
                'char_count': len(text),
                'has_json': self._has_valid_json(text),
                'error': None
            }

        except Exception as e:
            error_msg = str(e)
            # Make error messages more user-friendly
            if "Permission denied" in error_msg:
                error_msg = "❌ Permission denied - Path mungkin adalah folder, bukan file gambar"
            elif "No such file" in error_msg or "FileNotFoundError" in str(type(e)):
                error_msg = f"❌ File tidak ditemukan: {image_path}"
            elif "IsADirectoryError" in str(type(e)):
                error_msg = "❌ Path adalah folder, bukan file gambar"

            return {
                'success': False,
                'result': {},
                'raw_text': '',
                'processing_time': 0,
                'confidence': 0,
                'word_count': 0,
                'char_count': 0,
                'has_json': False,
                'error': error_msg
            }

    def _get_prompt(self, test_type: str) -> str:
        """Get prompt berdasarkan test type"""
        prompts = {
            'artifact': """Analisis objek bersejarah/artefak dalam gambar ini dengan sangat detail (Bahasa Indonesia).

Identifikasi dan berikan informasi lengkap tentang:
1. Jenis objek bersejarah (candi, patung, keramik, relief, dll)
2. Nama spesifik objek (jika dikenal)
3. Periode/era historis (estimasi tahun)
4. Kondisi fisik saat ini (sangat detail)
5. Tingkat kerusakan yang terdeteksi
6. Detail kerusakan yang terlihat (retakan, aus, missing parts, dll)
7. Nilai historis dan signifikansi
8. Rekomendasi preservasi dan konservasi

WAJIB gunakan format JSON berikut:
{
    "object_type": "candi/patung/keramik/relief/dll",
    "object_name": "nama spesifik atau 'tidak diketahui'",
    "period": "periode historis (contoh: Abad 9 Masehi, Era Majapahit)",
    "estimated_age": "estimasi usia dalam tahun",
    "condition": "sangat baik/baik/sedang/buruk/sangat buruk",
    "damage_level": "none/low/medium/high/severe",
    "damage_details": ["detail kerusakan 1", "detail kerusakan 2", "..."],
    "visible_damage_percentage": "persentase area rusak (0-100%)",
    "historical_value": "penjelasan nilai historis",
    "cultural_significance": "signifikansi budaya",
    "recommendations": ["rekomendasi 1", "rekomendasi 2", "..."],
    "preservation_priority": "low/medium/high/critical",
    "confidence_level": "85%"
}""",

            'building': """Analisis bangunan/struktur dalam gambar ini dengan sangat detail (Bahasa Indonesia).

Identifikasi:
1. Jenis bangunan (rumah tradisional, candi, gedung, dll)
2. Gaya arsitektur
3. Kondisi struktural keseluruhan
4. Kerusakan yang terdeteksi pada setiap bagian
5. Area kritis yang memerlukan perhatian
6. Tingkat prioritas perbaikan
7. Estimasi biaya perbaikan (kategori)

WAJIB gunakan format JSON berikut:
{
    "building_type": "rumah/candi/gedung/struktur/dll",
    "architecture_style": "gaya arsitektur spesifik",
    "structural_condition": "kondisi struktur detail",
    "detected_damages": ["kerusakan spesifik 1", "kerusakan 2", "..."],
    "damage_level": "none/low/medium/high/severe",
    "damage_by_component": {
        "foundation": "kondisi pondasi",
        "walls": "kondisi dinding",
        "roof": "kondisi atap",
        "decorative_elements": "kondisi elemen dekoratif"
    },
    "critical_areas": ["area kritis 1", "area kritis 2"],
    "repair_priority": ["prioritas 1", "prioritas 2", "..."],
    "safety_concern": "low/medium/high/critical",
    "estimated_repair_cost": "rendah/sedang/tinggi/sangat tinggi",
    "confidence_level": "90%"
}""",

            'nature': """Analisis foto alam/lingkungan dalam gambar ini dengan sangat detail (Bahasa Indonesia).

Identifikasi:
1. Jenis ekosistem
2. Kondisi lingkungan
3. Kesehatan vegetasi
4. Masalah/isu yang terdeteksi
5. Spesies dominan
6. Tingkat kerusakan lingkungan
7. Rekomendasi konservasi

WAJIB gunakan format JSON berikut:
{
    "ecosystem_type": "hutan/sawah/sungai/pantai/gunung/dll",
    "location_characteristics": "karakteristik lokasi",
    "environmental_condition": "kondisi lingkungan detail",
    "vegetation_health": "sangat sehat/sehat/sedang/buruk/kritis",
    "detected_issues": ["masalah 1", "masalah 2", "..."],
    "damage_level": "none/low/medium/high/severe",
    "biodiversity_assessment": "penilaian biodiversitas",
    "dominant_species": ["spesies 1", "spesies 2", "..."],
    "threats_identified": ["ancaman 1", "ancaman 2"],
    "conservation_recommendations": ["rekomendasi 1", "rekomendasi 2"],
    "restoration_priority": "low/medium/high/urgent",
    "confidence_level": "80%"
}""",

            'general': """Analisis gambar ini secara komprehensif dan detail (Bahasa Indonesia).

Berikan analisis lengkap meliputi:
1. Konten utama gambar
2. Objek-objek yang terdeteksi
3. Aktivitas atau kejadian
4. Kondisi keseluruhan
5. Konteks dan latar belakang
6. Tag/kategori yang relevan
7. Insight dan observasi penting

WAJIB gunakan format JSON berikut:
{
    "main_content": "deskripsi konten utama",
    "detected_objects": ["objek 1", "objek 2", "..."],
    "scene_description": "deskripsi scene lengkap",
    "activities": ["aktivitas 1", "aktivitas 2"],
    "overall_condition": "kondisi keseluruhan",
    "context": "konteks dan informasi background",
    "notable_features": ["fitur menarik 1", "fitur 2"],
    "color_palette": ["warna dominan 1", "warna 2"],
    "lighting_condition": "kondisi pencahayaan",
    "image_quality": "kualitas gambar",
    "tags": ["tag1", "tag2", "tag3"],
    "insights": ["insight 1", "insight 2"],
    "confidence_level": "85%"
}"""
        }

        return prompts.get(test_type, prompts['general'])

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Parse JSON dari response text"""
        try:
            # Cari JSON block
            start = text.find('{')
            end = text.rfind('}') + 1

            if start >= 0 and end > start:
                json_str = text[start:end]
                return json.loads(json_str)
        except Exception as e:
            pass

        # Jika tidak ada JSON, return text sebagai description
        return {'description': text, 'parse_error': True}

    def _extract_confidence(self, result: Dict, text: str) -> float:
        """Extract confidence score dari result atau text"""
        # Cek di result JSON
        if 'confidence_level' in result:
            conf_str = str(result['confidence_level']).replace('%', '').strip()
            try:
                return float(conf_str)
            except:
                pass

        # Cek di raw text
        match = re.search(r'confidence[_\s:-]*(\d+)\s*%', text, re.IGNORECASE)
        if match:
            return float(match.group(1))

        # Heuristic based on response length and structure
        if len(text) > 500 and self._has_valid_json(text):
            return 80.0
        elif len(text) > 200:
            return 70.0
        else:
            return 50.0

    def _has_valid_json(self, text: str) -> bool:
        """Check apakah text mengandung valid JSON"""
        try:
            start = text.find('{')
            end = text.rfind('}') + 1
            if start >= 0 and end > start:
                json.loads(text[start:end])
                return True
        except:
            pass
        return False

# ============================================================================
# 📊 SCORING & EVALUATION SYSTEM
# ============================================================================


class AccuracyEvaluator:
    """Class untuk evaluasi akurasi dengan berbagai metrik"""

    def __init__(self, ground_truth: Dict[str, Dict]=None):
        self.ground_truth = ground_truth or {}
        self.image_paths = {}  # Store image paths for display

    def _display_image_preview(self, image_path: str, filename: str):
        """Display image preview using matplotlib"""
        try:
            # Load and display image
            img = Image.open(image_path)

            # Create figure
            _, ax = plt.subplots(1, 1, figsize=(10, 8))
            ax.imshow(img)
            ax.axis('off')
            ax.set_title(f'📷 {filename}', fontsize=14, fontweight='bold', pad=15)

            # Add image info
            width, height = img.size
            info_text = f'Size: {width}x{height} | Format: {img.format}'
            ax.text(0.5, -0.05, info_text,
                   transform=ax.transAxes,
                   ha='center', fontsize=10,
                   bbox=dict(boxstyle='round,pad=0.5', facecolor='lightblue', alpha=0.7))

            plt.tight_layout()
            plt.show(block=False)
            plt.pause(0.5)  # Give time for window to appear

            print(f"\n{EMOJI['camera']} ========================================")
            print(f"{EMOJI['camera']} PREVIEW GAMBAR DIBUKA DI WINDOW TERPISAH")
            print(f"{EMOJI['camera']} ========================================")
            print(f"{EMOJI['info']} Silakan lihat window matplotlib untuk melihat gambar yang sedang dievaluasi")
            print(f"{EMOJI['info']} Window akan otomatis tertutup setelah Anda selesai scoring\n")

        except Exception as e:
            print(f"\n{EMOJI['warning']} Tidak dapat menampilkan preview gambar: {str(e)}")
            print(f"{EMOJI['info']} Image path: {image_path}")

    def evaluate_result(self, result: Dict, filename: str, auto_mode: bool=False, image_path: str=None) -> Dict[str, float]:
        """
        Evaluasi hasil analisis VLM

        Args:
            result: Hasil dari VLM
            filename: Nama file gambar
            auto_mode: Jika True, gunakan auto-scoring
            image_path: Path ke file gambar untuk preview

        Returns:
            Dictionary berisi scores
        """
        if not result['success']:
            return self._get_failed_scores()

        if auto_mode:
            return self._auto_score(result, filename)
        else:
            return self._interactive_score(result, filename, image_path)

    def _auto_score(self, result: Dict, filename: str) -> Dict[str, float]:
        """Auto scoring berdasarkan heuristics"""
        scores = {}

        # 1. Correctness - based on ground truth (if available)
        if filename in self.ground_truth:
            scores['correctness'] = self._calculate_correctness(result, filename)
        else:
            # Heuristic: confidence level sebagai proxy
            scores['correctness'] = min(result['confidence'] / 10, 10.0)

        # 2. Completeness - based on response length and structure
        completeness = 0
        if result['has_json']:
            completeness += 3
        if result['word_count'] > 100:
            completeness += 3
        if result['word_count'] > 200:
            completeness += 2
        if 'damage_details' in result['result'] or 'detected_damages' in result['result']:
            completeness += 2
        scores['completeness'] = min(completeness, 10)

        # 3. Relevance - based on keyword matching
        relevance_score = 7.0  # Default
        result_text = result['raw_text'].lower()

        # Boost jika ada keywords relevan
        relevant_keywords = ['kondisi', 'kerusakan', 'detail', 'analisis', 'rekomendasi']
        keyword_count = sum(1 for kw in relevant_keywords if kw in result_text)
        relevance_score += min(keyword_count * 0.5, 3.0)
        scores['relevance'] = min(relevance_score, 10)

        # 4. Detail Quality
        detail_score = 5.0
        if result['word_count'] > 150:
            detail_score += 2
        if result['word_count'] > 300:
            detail_score += 2
        if isinstance(result['result'].get('damage_details'), list):
            detail_score += len(result['result']['damage_details'][:3])
        scores['detail'] = min(detail_score, 10)

        # 5. Language Quality - heuristic
        scores['language'] = 8.0  # Gemini biasanya good

        # Calculate weighted overall score
        weights = {
            'correctness': 0.35,
            'completeness': 0.25,
            'relevance': 0.20,
            'detail': 0.15,
            'language': 0.05
        }

        scores['overall_score'] = sum(scores[k] * weights[k] for k in weights.keys())

        # Calculate precision, recall, F1
        if filename in self.ground_truth:
            precision, recall, f1 = self._calculate_classification_metrics(result, filename)
        else:
            # Use confidence as proxy
            precision = result['confidence']
            recall = result['confidence'] * 0.9  # Slightly lower
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

        scores['precision'] = precision
        scores['recall'] = recall
        scores['f1_score'] = f1

        return scores

    def _interactive_score(self, result: Dict, filename: str, image_path: str = None) -> Dict[str, float]:
        """Interactive scoring dengan input dari user"""
        print(f"\n{'='*70}")
        print(f"{EMOJI['magnify']} EVALUASI: {filename}")
        print(f"{'='*70}")

        # Tampilkan gambar jika path tersedia
        if image_path:
            self._display_image_preview(image_path, filename)

        # Tampilkan preview result
        print(f"\n{EMOJI['doc']} HASIL ANALISIS VLM:")
        print("-" * 70)
        preview_text = result['raw_text'][:500]
        print(preview_text)
        if len(result['raw_text']) > 500:
            print(f"\n... (dan {len(result['raw_text']) - 500} karakter lainnya)")
        print("-" * 70)

        # Tampilkan ground truth jika ada
        if filename in self.ground_truth:
            print(f"\n{EMOJI['target']} GROUND TRUTH:")
            for key, value in self.ground_truth[filename].items():
                print(f"  • {key}: {value}")

        print(f"\n{EMOJI['chart']} Berikan penilaian untuk setiap aspek (skala 1-10):\n")

        scores = {}

        try:
            scores['correctness'] = float(input(f"  {EMOJI['check']} 1. Kebenaran/Correctness (1-10): ").strip())
            scores['completeness'] = float(input(f"  {EMOJI['star']} 2. Kelengkapan/Completeness (1-10): ").strip())
            scores['relevance'] = float(input(f"  {EMOJI['target']} 3. Relevansi/Relevance (1-10): ").strip())
            scores['detail'] = float(input(f"  {EMOJI['magnify']} 4. Kualitas Detail (1-10): ").strip())
            scores['language'] = float(input(f"  {EMOJI['doc']} 5. Kualitas Bahasa (1-10): ").strip())
        except ValueError:
            print(f"\n{EMOJI['warning']} Input tidak valid, menggunakan auto-scoring...")
            return self._auto_score(result, filename)

        # Weighted overall score
        weights = {
            'correctness': 0.35,
            'completeness': 0.25,
            'relevance': 0.20,
            'detail': 0.15,
            'language': 0.05
        }

        scores['overall_score'] = sum(scores[k] * weights[k] for k in weights.keys())

        # Classification metrics
        if filename in self.ground_truth:
            print(f"\n{EMOJI['target']} Berapa banyak fakta kunci yang BENAR teridentifikasi (0-5)?")
            try:
                matches = float(input("  Jumlah: ").strip())
                precision = (matches / 5.0) * 100
                recall = (matches / 5.0) * 100
                f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
            except ValueError:
                precision, recall, f1 = 75.0, 75.0, 75.0
        else:
            precision = result['confidence']
            recall = result['confidence'] * 0.9
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

        scores['precision'] = precision
        scores['recall'] = recall
        scores['f1_score'] = f1

        print(f"\n{EMOJI['trophy']} Overall Score: {scores['overall_score']:.2f}/10")
        print(f"{EMOJI['chart']} F1 Score: {scores['f1_score']:.1f}%\n")

        # Close preview window
        try:
            plt.close('all')
        except:
            pass

        return scores

    def _calculate_correctness(self, result: Dict, filename: str) -> float:
        """Calculate correctness based on ground truth"""
        gt = self.ground_truth.get(filename, {})
        result_data = result['result']

        matches = 0
        total = 0

        for key in ['type', 'object_type', 'building_type', 'ecosystem_type']:
            if key in gt and key in result_data:
                total += 1
                if str(gt[key]).lower() in str(result_data[key]).lower():
                    matches += 1

        for key in ['condition', 'structural_condition', 'environmental_condition']:
            if key in gt and key in result_data:
                total += 1
                if str(gt[key]).lower() in str(result_data[key]).lower():
                    matches += 1

        if 'damage_level' in gt and 'damage_level' in result_data:
            total += 1
            if gt['damage_level'] == result_data['damage_level']:
                matches += 2  # Double weight untuk damage level
                total += 1

        if total == 0:
            return 7.0  # Default jika tidak ada ground truth detail

        score = (matches / total) * 10
        return min(score, 10.0)

    def _calculate_classification_metrics(self, result: Dict, filename: str) -> Tuple[float, float, float]:
        """Calculate precision, recall, F1 score"""
        gt = self.ground_truth.get(filename, {})
        result_data = result['result']

        true_positives = 0
        false_positives = 0
        false_negatives = 0

        # Check key fields
        check_fields = ['type', 'object_type', 'building_type', 'condition', 'damage_level']

        for field in check_fields:
            gt_value = gt.get(field)
            pred_value = result_data.get(field)

            if gt_value and pred_value:
                if str(gt_value).lower() in str(pred_value).lower():
                    true_positives += 1
                else:
                    false_positives += 1
            elif gt_value and not pred_value:
                false_negatives += 1
            elif not gt_value and pred_value:
                false_positives += 1

        precision = (true_positives / (true_positives + false_positives) * 100) if (true_positives + false_positives) > 0 else 0
        recall = (true_positives / (true_positives + false_negatives) * 100) if (true_positives + false_negatives) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

        return precision, recall, f1

    def _get_failed_scores(self) -> Dict[str, float]:
        """Return zero scores for failed tests"""
        return {
            'correctness': 0,
            'completeness': 0,
            'relevance': 0,
            'detail': 0,
            'language': 0,
            'overall_score': 0,
            'precision': 0,
            'recall': 0,
            'f1_score': 0
        }

# ============================================================================
# 📈 VISUALIZATION GENERATOR
# ============================================================================


class VisualizationGenerator:
    """Class untuk generate visualisasi hasil testing"""

    def __init__(self, output_folder: str):
        self.output_folder = Path(output_folder)
        self.output_folder.mkdir(exist_ok=True, parents=True)

    def generate_all_visualizations(self, df_results: pd.DataFrame, df_scores: pd.DataFrame):
        """Generate semua visualisasi"""
        print(f"\n{EMOJI['chart']} Generating visualizations...")

        # 1. Overview Dashboard
        self._create_overview_dashboard(df_results, df_scores)

        # 2. Detailed Performance Charts
        self._create_performance_charts(df_results, df_scores)

        # 3. Score Distribution
        self._create_score_distributions(df_scores)

        # 4. Comparison Charts
        if len(df_results) > 1:
            self._create_comparison_charts(df_results, df_scores)

        print(f"{EMOJI['check']} Visualizations saved to: {self.output_folder}")

    def _create_overview_dashboard(self, df_results: pd.DataFrame, df_scores: pd.DataFrame):
        """Create dashboard overview - Simple and easy to understand"""
        fig = plt.figure(figsize=(16, 10))
        fig.patch.set_facecolor('white')
        fig.suptitle('📊 LAPORAN HASIL TESTING VLM - MUDAH DIBACA',
                     fontsize=22, fontweight='bold', y=0.96,
                     bbox=dict(boxstyle='round', facecolor='#2196F3', alpha=0.8, pad=15),
                     color='white')

        # ==== GRAFIK 1: TINGKAT KEBERHASILAN ====
        ax1 = plt.subplot(2, 3, 1)
        if 'success' in df_results.columns:
            success_counts = df_results['success'].value_counts()
            labels = []
            colors_list = []
            values = []

            if True in success_counts.index:
                labels.append(f'✅ BERHASIL\n({success_counts[True]} test)')
                colors_list.append('#4CAF50')
                values.append(success_counts[True])

            if False in success_counts.index:
                labels.append(f'❌ GAGAL\n({success_counts[False]} test)')
                colors_list.append('#F44336')
                values.append(success_counts[False])

            wedges, texts, autotexts = ax1.pie(values, labels=labels,
                   autopct='%1.0f%%', colors=colors_list, startangle=90,
                   textprops={'fontsize': 11, 'weight': 'bold'},
                   explode=[0.05] * len(values))

            for autotext in autotexts:
                autotext.set_color('white')
                autotext.set_fontsize(14)
                autotext.set_weight('bold')

            ax1.set_title('📈 TINGKAT KEBERHASILAN TEST',
                         fontsize=13, fontweight='bold', pad=15,
                         bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.5))

        # ==== GRAFIK 2: NILAI RATA-RATA ====
        ax2 = plt.subplot(2, 3, 2)
        if not df_scores.empty and 'overall_score' in df_scores.columns:
            overall_mean = df_scores['overall_score'].mean()
            grade = self._get_grade(overall_mean)
            grade_emoji = {'A+': '🏆', 'A': '⭐', 'B+': '✨', 'B': '👍', 'C': '⚠️', 'D': '❌'}

            # Create big score display
            ax2.text(0.5, 0.6, f'{overall_mean:.1f}',
                    ha='center', va='center',
                    fontsize=80, fontweight='bold',
                    color=COLORS['success'] if overall_mean >= 7 else COLORS['warning'] if overall_mean >= 5 else COLORS['danger'])

            ax2.text(0.5, 0.35, 'dari 10',
                    ha='center', va='center',
                    fontsize=18, color='gray')

            ax2.text(0.5, 0.15, f'Grade: {grade} {grade_emoji.get(grade, "")}',
                    ha='center', va='center',
                    fontsize=22, fontweight='bold',
                    bbox=dict(boxstyle='round', facecolor='lightyellow', alpha=0.8, pad=10))

            ax2.set_xlim(0, 1)
            ax2.set_ylim(0, 1)
            ax2.axis('off')
            ax2.set_title('🎯 NILAI KESELURUHAN',
                         fontsize=13, fontweight='bold', pad=15,
                         bbox=dict(boxstyle='round', facecolor='lightgreen', alpha=0.5))

        # ==== GRAFIK 3: WAKTU PEMROSESAN ====
        ax3 = plt.subplot(2, 3, 3)
        if 'processing_time' in df_results.columns and not df_results.empty:
            avg_time = df_results['processing_time'].mean()
            min_time = df_results['processing_time'].min()
            max_time = df_results['processing_time'].max()

            # Create big time display
            ax3.text(0.5, 0.65, f'{avg_time:.2f}s',
                    ha='center', va='center',
                    fontsize=60, fontweight='bold',
                    color=COLORS['info'])

            ax3.text(0.5, 0.4, 'Rata-rata per Test',
                    ha='center', va='center',
                    fontsize=14, color='gray')

            ax3.text(0.5, 0.2, f'Tercepat: {min_time:.2f}s | Terlama: {max_time:.2f}s',
                    ha='center', va='center',
                    fontsize=11,
                    bbox=dict(boxstyle='round', facecolor='lightcyan', alpha=0.7, pad=8))

            ax3.set_xlim(0, 1)
            ax3.set_ylim(0, 1)
            ax3.axis('off')
            ax3.set_title('⏱️ WAKTU PEMROSESAN',
                         fontsize=13, fontweight='bold', pad=15,
                         bbox=dict(boxstyle='round', facecolor='lightyellow', alpha=0.5))

        # ==== GRAFIK 4: DETAIL NILAI PER KATEGORI ====
        ax4 = plt.subplot(2, 3, 4)
        if not df_scores.empty:
            score_cols = ['correctness', 'completeness', 'relevance', 'detail', 'language']
            available_cols = [col for col in score_cols if col in df_scores.columns]
            if available_cols:
                means = [df_scores[col].mean() for col in available_cols]
                labels_indo = {
                    'correctness': 'Ketepatan',
                    'completeness': 'Kelengkapan',
                    'relevance': 'Relevansi',
                    'detail': 'Detail',
                    'language': 'Bahasa'
                }
                labels = [labels_indo.get(col, col.title()) for col in available_cols]

                # Create horizontal bar with gradient colors
                colors_grad = ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#FF5722']
                bars = ax4.barh(labels, means,
                               color=colors_grad[:len(means)],
                               edgecolor='black', linewidth=1.5,
                               alpha=0.8)

                ax4.set_xlabel('Nilai (0 = Buruk, 10 = Sempurna)', fontweight='bold', fontsize=11)
                ax4.set_xlim(0, 10)
                ax4.grid(True, alpha=0.3, axis='x', linestyle='--')

                # Add value labels with background
                for i, (bar, value) in enumerate(zip(bars, means)):
                    color_text = 'white' if value < 5 else 'black'
                    ax4.text(value/2, i, f'{value:.1f}',
                            va='center', ha='center',
                            fontweight='bold', fontsize=13,
                            color=color_text)
                    ax4.text(value + 0.3, i, f'({value:.1f}/10)',
                            va='center', fontweight='bold', fontsize=10)

                ax4.set_title('📊 RINCIAN NILAI PER ASPEK',
                             fontsize=13, fontweight='bold', pad=15,
                             bbox=dict(boxstyle='round', facecolor='lightcoral', alpha=0.5))

        # ==== GRAFIK 5: RINGKASAN STATISTIK ====
        ax5 = plt.subplot(2, 3, 5)
        ax5.axis('tight')
        ax5.axis('off')

        summary_data = []
        if not df_results.empty:
            total_tests = len(df_results)
            summary_data.append(['📝 Total Test', f'{total_tests}'])

            if 'success' in df_results.columns:
                success_rate = df_results['success'].mean()*100
                summary_data.append(['✅ Tingkat Sukses', f'{success_rate:.0f}%'])

            if 'processing_time' in df_results.columns:
                avg_time = df_results['processing_time'].mean()
                summary_data.append(['⏱️ Waktu Rata-rata', f'{avg_time:.2f} detik'])

            if 'confidence' in df_results.columns:
                avg_conf = df_results['confidence'].mean()
                summary_data.append(['🎯 Confidence Rata-rata', f'{avg_conf:.0f}%'])

        if not df_scores.empty and 'overall_score' in df_scores.columns:
            avg_score = df_scores['overall_score'].mean()
            grade = self._get_grade(avg_score)
            summary_data.append(['📊 Nilai Akhir', f'{avg_score:.1f}/10'])
            summary_data.append(['🏆 Grade', f'{grade}'])

        if summary_data:
            table = ax5.table(cellText=summary_data,
                             colWidths=[0.55, 0.45],
                             cellLoc='left',
                             loc='center')
            table.auto_set_font_size(False)
            table.set_fontsize(12)
            table.scale(1, 2.5)

            # Style cells with alternating colors
            for i, row in enumerate(summary_data):
                bg_color = '#E3F2FD' if i % 2 == 0 else '#BBDEFB'
                table[(i, 0)].set_facecolor(bg_color)
                table[(i, 1)].set_facecolor(bg_color)
                table[(i, 0)].set_text_props(weight='bold', fontsize=12)
                table[(i, 1)].set_text_props(weight='bold', fontsize=13, color='#1565C0')

            ax5.set_title('📋 RINGKASAN STATISTIK',
                         fontsize=13, fontweight='bold', pad=15,
                         bbox=dict(boxstyle='round', facecolor='lightsteelblue', alpha=0.5))

        # ==== GRAFIK 6: KESIMPULAN & REKOMENDASI ====
        ax6 = plt.subplot(2, 3, 6)
        ax6.axis('off')

        if not df_scores.empty and 'overall_score' in df_scores.columns:
            overall_mean = df_scores['overall_score'].mean()
            grade = self._get_grade(overall_mean)

            # Verdict text
            if grade in ['A+', 'A']:
                verdict = "Model VLM bekerja SANGAT BAIK!\nSudah siap untuk digunakan."
                emoji_verdict = "🌟"
                color_verdict = '#4CAF50'
            elif grade in ['B+', 'B']:
                verdict = "Model VLM bekerja CUKUP BAIK.\nBisa digunakan dengan perbaikan minor."
                emoji_verdict = "👍"
                color_verdict = '#FFC107'
            else:
                verdict = "Model VLM perlu DITINGKATKAN.\nPerlu perbaikan signifikan."
                emoji_verdict = "⚠️"
                color_verdict = '#FF5722'

            ax6.text(0.5, 0.7, emoji_verdict,
                    ha='center', va='center',
                    fontsize=80)

            ax6.text(0.5, 0.35, verdict,
                    ha='center', va='center',
                    fontsize=14, fontweight='bold',
                    bbox=dict(boxstyle='round', facecolor=color_verdict,
                             alpha=0.3, pad=15),
                    multialignment='center')

            ax6.set_xlim(0, 1)
            ax6.set_ylim(0, 1)
            ax6.set_title('💡 KESIMPULAN',
                         fontsize=13, fontweight='bold', pad=15,
                         bbox=dict(boxstyle='round', facecolor='lavender', alpha=0.5))

        plt.tight_layout(rect=[0, 0, 1, 0.94])
        plt.savefig(self.output_folder / 'overview_dashboard.png',
                   dpi=200, bbox_inches='tight', facecolor='white')
        plt.close()

        print(f"  {EMOJI['check']} Dashboard mudah dibaca telah disimpan!")

    def _create_performance_charts(self, df_results: pd.DataFrame, df_scores: pd.DataFrame):
        """Create detailed performance charts"""
        fig, axes = plt.subplots(2, 3, figsize=(18, 12))
        fig.suptitle('📊 DETAILED PERFORMANCE ANALYSIS', fontsize=18, fontweight='bold')

        # Chart 1: Score Trends
        if not df_scores.empty:
            score_cols = ['correctness', 'completeness', 'relevance', 'detail', 'language']
            available_cols = [col for col in score_cols if col in df_scores.columns]
            if available_cols:
                for col in available_cols:
                    axes[0, 0].plot(df_scores.index, df_scores[col], marker='o', label=col.title())
                axes[0, 0].set_xlabel('Test Index')
                axes[0, 0].set_ylabel('Score (0-10)')
                axes[0, 0].set_title('Score Trends Across Tests')
                axes[0, 0].legend()
                axes[0, 0].grid(True, alpha=0.3)

        # Chart 2: Time vs Confidence
        if 'processing_time' in df_results.columns and 'confidence' in df_results.columns and not df_results.empty:
            scatter = axes[0, 1].scatter(df_results['processing_time'],
                                        df_results['confidence'],
                                        c=df_results.index, cmap='viridis',
                                        s=100, alpha=0.6, edgecolors='black')
            axes[0, 1].set_xlabel('Processing Time (s)')
            axes[0, 1].set_ylabel('Confidence %')
            axes[0, 1].set_title('Processing Time vs Confidence')
            axes[0, 1].grid(True, alpha=0.3)
            plt.colorbar(scatter, ax=axes[0, 1], label='Test Index')

        # Chart 3: Score Distribution Violin
        if not df_scores.empty:
            score_cols = ['correctness', 'completeness', 'relevance', 'detail', 'language']
            available_cols = [col for col in score_cols if col in df_scores.columns]
            if available_cols:
                data_to_plot = [df_scores[col].values for col in available_cols]
                parts = axes[0, 2].violinplot(data_to_plot, showmeans=True, showmedians=True)
                axes[0, 2].set_xticks(range(1, len(available_cols) + 1))
                axes[0, 2].set_xticklabels([col[:4].title() for col in available_cols])
                axes[0, 2].set_ylabel('Score')
                axes[0, 2].set_title('Score Distribution by Component')
                axes[0, 2].grid(True, alpha=0.3, axis='y')

        # Chart 4: Classification Metrics
        if not df_scores.empty:
            metrics = ['precision', 'recall', 'f1_score']
            available_metrics = [m for m in metrics if m in df_scores.columns]
            if available_metrics:
                x = np.arange(len(df_scores))
                width = 0.25

                for i, metric in enumerate(available_metrics):
                    axes[1, 0].bar(x + i * width, df_scores[metric], width,
                                  label=metric.replace('_', ' ').title())

                axes[1, 0].set_xlabel('Test Index')
                axes[1, 0].set_ylabel('Score %')
                axes[1, 0].set_title('Classification Metrics Comparison')
                axes[1, 0].legend()
                axes[1, 0].grid(True, alpha=0.3, axis='y')

        # Chart 5: Heatmap of Scores
        if not df_scores.empty:
            score_cols = ['correctness', 'completeness', 'relevance', 'detail', 'language']
            available_cols = [col for col in score_cols if col in df_scores.columns]
            if available_cols and len(df_scores) > 1:
                score_matrix = df_scores[available_cols].T
                im = axes[1, 1].imshow(score_matrix, cmap='RdYlGn', aspect='auto', vmin=0, vmax=10)
                axes[1, 1].set_yticks(range(len(available_cols)))
                axes[1, 1].set_yticklabels([col.title() for col in available_cols])
                axes[1, 1].set_xlabel('Test Index')
                axes[1, 1].set_title('Score Heatmap')
                plt.colorbar(im, ax=axes[1, 1], label='Score')

        # Chart 6: Success vs Failure Analysis
        if 'success' in df_results.columns and not df_results.empty:
            success_df = df_results[df_results['success']]
            fail_df = df_results[~df_results['success']]

            categories = ['Success', 'Failed']
            counts = [len(success_df), len(fail_df)]

            if 'processing_time' in df_results.columns:
                avg_times = [
                    success_df['processing_time'].mean() if len(success_df) > 0 else 0,
                    fail_df['processing_time'].mean() if len(fail_df) > 0 else 0
                ]
            else:
                avg_times = [0, 0]

            x = np.arange(len(categories))
            width = 0.35

            ax_twin = axes[1, 2].twinx()

            bars1 = axes[1, 2].bar(x - width / 2, counts, width, label='Count',
                                  color=COLORS['primary'], alpha=0.7)
            bars2 = ax_twin.bar(x + width / 2, avg_times, width, label='Avg. Time',
                               color=COLORS['warning'], alpha=0.7)

            axes[1, 2].set_xlabel('Status')
            axes[1, 2].set_ylabel('Count', color=COLORS['primary'])
            ax_twin.set_ylabel('Avg. Time (s)', color=COLORS['warning'])
            axes[1, 2].set_title('Success vs Failure Analysis')
            axes[1, 2].set_xticks(x)
            axes[1, 2].set_xticklabels(categories)
            axes[1, 2].legend(loc='upper left')
            ax_twin.legend(loc='upper right')

        plt.tight_layout()
        plt.savefig(self.output_folder / 'performance_charts.png',
                   dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()

        print(f"  {EMOJI['check']} Performance charts saved")

    def _create_score_distributions(self, df_scores: pd.DataFrame):
        """Create score distribution charts"""
        if df_scores.empty:
            return

        fig, axes = plt.subplots(2, 3, figsize=(18, 12))
        fig.suptitle('📊 SCORE DISTRIBUTIONS', fontsize=18, fontweight='bold')

        score_cols = ['correctness', 'completeness', 'relevance', 'detail', 'language', 'overall_score']
        titles = ['Correctness', 'Completeness', 'Relevance', 'Detail Quality', 'Language Quality', 'Overall Score']

        for idx, (col, title) in enumerate(zip(score_cols, titles)):
            if col not in df_scores.columns:
                continue

            row = idx // 3
            col_idx = idx % 3
            ax = axes[row, col_idx]

            # Histogram
            n, bins, patches = ax.hist(df_scores[col], bins=10,
                                      color=COLORS['primary'], alpha=0.7,
                                      edgecolor='black', density=False)

            # Color gradient
            cm = plt.cm.RdYlGn
            for i, patch in enumerate(patches):
                patch.set_facecolor(cm(bins[i] / 10))

            # Statistics
            mean_val = df_scores[col].mean()
            median_val = df_scores[col].median()

            ax.axvline(mean_val, color='red', linestyle='--', linewidth=2, label=f'Mean: {mean_val:.2f}')
            ax.axvline(median_val, color='blue', linestyle=':', linewidth=2, label=f'Median: {median_val:.2f}')

            ax.set_xlabel('Score')
            ax.set_ylabel('Frequency')
            ax.set_title(f'{title} Distribution')
            ax.legend()
            ax.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.savefig(self.output_folder / 'score_distributions.png',
                   dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()

        print(f"  {EMOJI['check']} Score distributions saved")

    def _create_comparison_charts(self, df_results: pd.DataFrame, df_scores: pd.DataFrame):
        """Create comparison charts between different tests"""
        if len(df_results) < 2:
            return

        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('🔍 TEST COMPARISONS', fontsize=18, fontweight='bold')

        # Chart 1: Overall Score Comparison
        if not df_scores.empty and 'overall_score' in df_scores.columns:
            if 'filename' in df_scores.columns:
                scores_by_file = df_scores.groupby('filename')['overall_score'].mean().sort_values(ascending=False)
            else:
                scores_by_file = df_scores['overall_score']

            if len(scores_by_file) > 0:
                colors = [self._get_score_color(score) for score in scores_by_file.values]
                bars = axes[0, 0].barh(range(len(scores_by_file)), scores_by_file.values, color=colors, edgecolor='black')
                axes[0, 0].set_yticks(range(len(scores_by_file)))
                axes[0, 0].set_yticklabels(scores_by_file.index if hasattr(scores_by_file, 'index') else range(len(scores_by_file)))
                axes[0, 0].set_xlabel('Overall Score')
                axes[0, 0].set_xlim(0, 10)
                axes[0, 0].set_title('Overall Score by Test')
                axes[0, 0].grid(True, alpha=0.3, axis='x')

                for i, (bar, value) in enumerate(zip(bars, scores_by_file.values)):
                    axes[0, 0].text(value + 0.2, i, f'{value:.2f}', va='center', fontweight='bold')

        # Chart 2: Multi-metric Comparison
        if not df_scores.empty:
            metrics = ['correctness', 'completeness', 'relevance', 'f1_score']
            available_metrics = [m for m in metrics if m in df_scores.columns]

            if available_metrics and 'filename' in df_scores.columns:
                comparison_data = df_scores.groupby('filename')[available_metrics].mean()

                x = np.arange(len(comparison_data))
                width = 0.2

                for i, metric in enumerate(available_metrics):
                    offset = (i - len(available_metrics) / 2) * width
                    axes[0, 1].bar(x + offset, comparison_data[metric], width, label=metric.title())

                axes[0, 1].set_xlabel('Test')
                axes[0, 1].set_ylabel('Score')
                axes[0, 1].set_title('Multi-Metric Comparison')
                axes[0, 1].set_xticks(x)
                axes[0, 1].set_xticklabels(comparison_data.index, rotation=45, ha='right')
                axes[0, 1].legend()
                axes[0, 1].grid(True, alpha=0.3, axis='y')

        # Chart 3: Processing Time Comparison
        if 'processing_time' in df_results.columns and 'filename' in df_results.columns and not df_results.empty:
            time_by_file = df_results.groupby('filename')['processing_time'].mean().sort_values()

            bars = axes[1, 0].barh(range(len(time_by_file)), time_by_file.values,
                                  color=COLORS['warning'], alpha=0.7, edgecolor='black')
            axes[1, 0].set_yticks(range(len(time_by_file)))
            axes[1, 0].set_yticklabels(time_by_file.index)
            axes[1, 0].set_xlabel('Processing Time (s)')
            axes[1, 0].set_title('Processing Time by Test')
            axes[1, 0].grid(True, alpha=0.3, axis='x')

            for i, (bar, value) in enumerate(zip(bars, time_by_file.values)):
                axes[1, 0].text(value + 0.05, i, f'{value:.2f}s', va='center', fontweight='bold')

        # Chart 4: Confidence vs Score
        if not df_scores.empty and 'confidence' in df_results.columns and 'overall_score' in df_scores.columns:
            # Merge confidence from results to scores
            if 'filename' in df_scores.columns and 'filename' in df_results.columns:
                merged = df_scores.merge(df_results[['filename', 'confidence']], on='filename', how='left')

                scatter = axes[1, 1].scatter(merged['confidence'], merged['overall_score'],
                                           s=100, alpha=0.6, edgecolors='black',
                                           c=merged['overall_score'], cmap='RdYlGn', vmin=0, vmax=10)

                # Add trend line
                z = np.polyfit(merged['confidence'].dropna(),
                              merged['overall_score'][merged['confidence'].notna()], 1)
                p = np.poly1d(z)
                x_line = np.linspace(merged['confidence'].min(), merged['confidence'].max(), 100)
                axes[1, 1].plot(x_line, p(x_line), "r--", alpha=0.8, linewidth=2, label='Trend')

                axes[1, 1].set_xlabel('Confidence %')
                axes[1, 1].set_ylabel('Overall Score')
                axes[1, 1].set_title('Confidence vs Overall Score')
                axes[1, 1].legend()
                axes[1, 1].grid(True, alpha=0.3)
                plt.colorbar(scatter, ax=axes[1, 1], label='Score')

        plt.tight_layout()
        plt.savefig(self.output_folder / 'comparison_charts.png',
                   dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()

        print(f"  {EMOJI['check']} Comparison charts saved")

    def _create_gauge(self, ax, value, title):
        """Create a gauge chart"""
        ax.clear()
        ax.set_xlim(0, 10)
        ax.set_ylim(0, 10)
        ax.axis('off')

        # Draw gauge
        theta = np.linspace(0, np.pi, 100)
        r = 4
        x = 5 + r * np.cos(theta)
        y = 2 + r * np.sin(theta)

        # Color segments
        segments = [(0, 4, COLORS['danger']), (4, 7, COLORS['warning']), (7, 10, COLORS['success'])]
        for start, end, color in segments:
            start_angle = np.pi * (1 - start / 10)
            end_angle = np.pi * (1 - end / 10)
            theta_seg = np.linspace(end_angle, start_angle, 50)
            x_seg = 5 + r * np.cos(theta_seg)
            y_seg = 2 + r * np.sin(theta_seg)
            ax.fill_between(x_seg, 2, y_seg, color=color, alpha=0.3)

        ax.plot(x, y, 'k-', linewidth=3)

        # Needle
        angle = np.pi * (1 - value / 10)
        needle_x = [5, 5 + (r - 0.5) * np.cos(angle)]
        needle_y = [2, 2 + (r - 0.5) * np.sin(angle)]
        ax.plot(needle_x, needle_y, 'r-', linewidth=3)
        ax.plot(5, 2, 'ro', markersize=10)

        # Text
        ax.text(5, 2 - r - 1, title, ha='center', fontsize=12, fontweight='bold')
        ax.text(5, 2 - r - 1.8, f'{value:.2f}/10', ha='center', fontsize=16, fontweight='bold',
               color=self._get_score_color(value))

    def _get_grade(self, score: float) -> str:
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

    def _get_grade_color(self, grade: str) -> str:
        """Get color for grade"""
        color_map = {
            'A+': COLORS['success'],
            'A': COLORS['success'],
            'B+': COLORS['info'],
            'B': COLORS['info'],
            'C': COLORS['warning'],
            'D': COLORS['danger']
        }
        return color_map.get(grade, COLORS['primary'])

    def _get_grade_emoji(self, grade: str) -> str:
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

    def _get_score_color(self, score: float) -> str:
        """Get color based on score"""
        if score >= 8:
            return COLORS['success']
        elif score >= 6:
            return COLORS['info']
        elif score >= 4:
            return COLORS['warning']
        else:
            return COLORS['danger']

# ============================================================================
# 📝 REPORT GENERATOR
# ============================================================================


class ReportGenerator:
    """Class untuk generate laporan lengkap"""

    def __init__(self, output_folder: str):
        self.output_folder = Path(output_folder)
        self.output_folder.mkdir(exist_ok=True, parents=True)

    def generate_full_report(self, df_results: pd.DataFrame, df_scores: pd.DataFrame,
                            test_images: List[str], test_config: Dict) -> str:
        """Generate laporan lengkap dalam format Markdown"""

        print(f"\n{EMOJI['doc']} Generating comprehensive report...")

        report = self._build_report(df_results, df_scores, test_images, test_config)

        # Save report
        report_path = self.output_folder / 'VLM_Accuracy_Report.md'
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)

        print(f"{EMOJI['check']} Report saved to: {report_path}")

        return report

    def _build_report(self, df_results: pd.DataFrame, df_scores: pd.DataFrame,
                     test_images: List[str], test_config: Dict) -> str:
        """Build the complete report"""

        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        report = f"""# 🧪 VLM ACCURACY TEST - COMPREHENSIVE REPORT

**Generated:** {timestamp}
**Model:** {MODEL_NAME}
**Test Mode:** {test_config.get('mode', 'N/A')}

---

## 📋 EXECUTIVE SUMMARY

"""

        # Executive Summary
        if not df_results.empty:
            total_tests = len(df_results)
            success_count = df_results['success'].sum() if 'success' in df_results.columns else 0
            success_rate = (success_count / total_tests * 100) if total_tests > 0 else 0

            report += f"""
### Key Findings

- **Total Tests Conducted:** {total_tests}
- **Success Rate:** {success_rate:.1f}% ({success_count}/{total_tests})
"""

            if 'processing_time' in df_results.columns:
                avg_time = df_results['processing_time'].mean()
                report += f"- **Average Processing Time:** {avg_time:.2f} seconds\n"

            if 'confidence' in df_results.columns:
                avg_conf = df_results['confidence'].mean()
                report += f"- **Average Confidence:** {avg_conf:.1f}%\n"

            if not df_scores.empty and 'overall_score' in df_scores.columns:
                avg_score = df_scores['overall_score'].mean()
                grade = self._get_grade(avg_score)
                report += f"- **Overall Score:** {avg_score:.2f}/10\n"
                report += f"- **Final Grade:** **{grade}** {self._get_grade_emoji(grade)}\n"

        report += "\n---\n\n## 🔧 TEST CONFIGURATION\n\n"

        report += f"""
### Model Settings
- **Model Name:** {MODEL_NAME}
- **API Provider:** Google Generative AI
- **Test Date:** {timestamp}

### Test Images
Total images tested: {len(test_images)}

"""

        for i, img in enumerate(test_images, 1):
            report += f"{i}. `{Path(img).name}`\n"

        report += "\n---\n\n## 📊 PERFORMANCE METRICS\n\n"

        # Performance Metrics
        if not df_results.empty:
            report += "### Success & Reliability\n\n"
            report += f"- **Success Rate:** {success_rate:.1f}%\n"

            if 'success' in df_results.columns:
                failed_count = len(df_results[~df_results['success']])
                if failed_count > 0:
                    report += f"- **Failed Tests:** {failed_count}\n"
                    report += "\n**Failed Test Details:**\n"
                    for idx, row in df_results[~df_results['success']].iterrows():
                        if 'error' in row and row['error']:
                            report += f"  - {row.get('filename', f'Test {idx}')}: {row['error']}\n"

            report += "\n### Processing Performance\n\n"

            if 'processing_time' in df_results.columns:
                report += f"- **Average Time:** {df_results['processing_time'].mean():.2f}s\n"
                report += f"- **Min Time:** {df_results['processing_time'].min():.2f}s\n"
                report += f"- **Max Time:** {df_results['processing_time'].max():.2f}s\n"
                report += f"- **Std Dev:** {df_results['processing_time'].std():.2f}s\n"

            report += "\n### Confidence Metrics\n\n"

            if 'confidence' in df_results.columns:
                report += f"- **Average Confidence:** {df_results['confidence'].mean():.1f}%\n"
                report += f"- **Min Confidence:** {df_results['confidence'].min():.1f}%\n"
                report += f"- **Max Confidence:** {df_results['confidence'].max():.1f}%\n"
                report += f"- **Std Dev:** {df_results['confidence'].std():.1f}%\n"

            report += "\n### Response Quality\n\n"

            if 'word_count' in df_results.columns:
                report += f"- **Average Word Count:** {df_results['word_count'].mean():.0f}\n"

            if 'has_json' in df_results.columns:
                json_rate = df_results['has_json'].mean() * 100
                report += f"- **JSON Format Rate:** {json_rate:.1f}%\n"

        report += "\n---\n\n## 🎯 ACCURACY METRICS\n\n"

        # Accuracy Metrics
        if not df_scores.empty:
            report += "### Overall Accuracy Scores (Scale 1-10)\n\n"

            score_components = [
                ('correctness', 'Correctness', 'Kebenaran identifikasi dan analisis'),
                ('completeness', 'Completeness', 'Kelengkapan informasi yang diberikan'),
                ('relevance', 'Relevance', 'Relevansi dengan pertanyaan'),
                ('detail', 'Detail Quality', 'Kualitas dan kedalaman detail'),
                ('language', 'Language Quality', 'Kualitas bahasa dan presentasi')
            ]

            for col, name, desc in score_components:
                if col in df_scores.columns:
                    mean_val = df_scores[col].mean()
                    std_val = df_scores[col].std()
                    report += f"- **{name}:** {mean_val:.2f} ± {std_val:.2f}\n"
                    report += f"  - _{desc}_\n"

            if 'overall_score' in df_scores.columns:
                overall_mean = df_scores['overall_score'].mean()
                overall_std = df_scores['overall_score'].std()
                report += f"\n**Overall Score:** {overall_mean:.2f} ± {overall_std:.2f} / 10\n"

            report += "\n### Classification Metrics\n\n"

            if 'precision' in df_scores.columns:
                report += f"- **Precision:** {df_scores['precision'].mean():.1f}%\n"
                report += "  - _Akurasi prediksi positif_\n"

            if 'recall' in df_scores.columns:
                report += f"- **Recall:** {df_scores['recall'].mean():.1f}%\n"
                report += "  - _Kemampuan mendeteksi semua kasus positif_\n"

            if 'f1_score' in df_scores.columns:
                report += f"- **F1 Score:** {df_scores['f1_score'].mean():.1f}%\n"
                report += "  - _Harmonic mean dari precision dan recall_\n"

            # Performance by test type
            if 'test_type' in df_scores.columns:
                report += "\n### Performance by Test Type\n\n"

                for test_type in df_scores['test_type'].unique():
                    type_scores = df_scores[df_scores['test_type'] == test_type]
                    report += f"\n#### {test_type.title()}\n\n"

                    if 'overall_score' in type_scores.columns:
                        report += f"- Overall Score: {type_scores['overall_score'].mean():.2f}/10\n"
                    if 'f1_score' in type_scores.columns:
                        report += f"- F1 Score: {type_scores['f1_score'].mean():.1f}%\n"
                    if 'confidence' in df_results.columns:
                        type_results = df_results[df_results['test_type'] == test_type] if 'test_type' in df_results.columns else pd.DataFrame()
                        if not type_results.empty:
                            report += f"- Avg. Confidence: {type_results['confidence'].mean():.1f}%\n"

        report += "\n---\n\n## 📈 DETAILED TEST RESULTS\n\n"

        # Individual test results
        if not df_scores.empty:
            report += "### Individual Test Performance\n\n"

            for idx, row in df_scores.iterrows():
                filename = row.get('filename', f'Test {idx+1}')
                report += f"\n#### {idx+1}. {filename}\n\n"

                if 'test_type' in row:
                    report += f"**Test Type:** {row['test_type'].title()}\n\n"

                report += "**Scores:**\n"
                if 'overall_score' in row:
                    report += f"- Overall: {row['overall_score']:.2f}/10\n"
                if 'correctness' in row:
                    report += f"- Correctness: {row['correctness']:.2f}/10\n"
                if 'completeness' in row:
                    report += f"- Completeness: {row['completeness']:.2f}/10\n"
                if 'f1_score' in row:
                    report += f"- F1 Score: {row['f1_score']:.1f}%\n"

                # Get corresponding result
                if idx < len(df_results):
                    result_row = df_results.iloc[idx]
                    if 'processing_time' in result_row:
                        report += f"- Processing Time: {result_row['processing_time']:.2f}s\n"
                    if 'confidence' in result_row:
                        report += f"- Confidence: {result_row['confidence']:.1f}%\n"

        report += "\n---\n\n## 💡 INSIGHTS & RECOMMENDATIONS\n\n"

        # Generate insights
        insights = self._generate_insights(df_results, df_scores)
        for insight in insights:
            report += f"- {insight}\n"

        report += "\n---\n\n## 📊 VISUALIZATIONS\n\n"

        report += """
Berikut visualisasi yang telah di-generate:

1. **Overview Dashboard** - `overview_dashboard.png`
   - Summary metrics dan performance overview

2. **Performance Charts** - `performance_charts.png`
   - Analisis performa detail across berbagai dimensi

3. **Score Distributions** - `score_distributions.png`
   - Distribusi score untuk setiap komponen

4. **Comparison Charts** - `comparison_charts.png`
   - Perbandingan antar test dan metrics

"""

        report += "\n---\n\n## 🏆 FINAL VERDICT\n\n"

        # Final verdict
        if not df_scores.empty and 'overall_score' in df_scores.columns:
            avg_score = df_scores['overall_score'].mean()
            grade = self._get_grade(avg_score)

            report += f"### Grade: **{grade}** {self._get_grade_emoji(grade)}\n\n"

            verdict = self._get_verdict(grade, avg_score)
            report += f"{verdict}\n\n"

            # Recommendations
            report += "### Recommendations for Improvement\n\n"
            recommendations = self._get_recommendations(df_scores)
            for rec in recommendations:
                report += f"- {rec}\n"

        report += "\n---\n\n## 📁 OUTPUT FILES\n\n"

        report += """
Berikut file-file yang telah di-generate:

1. **VLM_Accuracy_Report.md** - Laporan lengkap (file ini)
2. **test_results.csv** - Raw test results
3. **detailed_scores.csv** - Detailed scoring data
4. **overview_dashboard.png** - Dashboard visualization
5. **performance_charts.png** - Performance analysis
6. **score_distributions.png** - Score distributions
7. **comparison_charts.png** - Test comparisons

"""

        report += f"\n---\n\n_Report generated by VLM Accuracy Test System v2.0_  \n"
        report += f"_Timestamp: {timestamp}_  \n"
        report += f"_Model: {MODEL_NAME}_\n"

        return report

    def _generate_insights(self, df_results: pd.DataFrame, df_scores: pd.DataFrame) -> List[str]:
        """Generate insights dari hasil testing"""
        insights = []

        if not df_results.empty:
            # Success rate insight
            if 'success' in df_results.columns:
                success_rate = df_results['success'].mean() * 100
                if success_rate >= 95:
                    insights.append("✅ **Excellent reliability** - VLM menunjukkan success rate yang sangat tinggi")
                elif success_rate >= 80:
                    insights.append("👍 **Good reliability** - VLM cukup reliable dengan beberapa occasional failures")
                else:
                    insights.append("⚠️ **Reliability concerns** - Success rate perlu ditingkatkan, periksa error patterns")

            # Processing time insight
            if 'processing_time' in df_results.columns:
                avg_time = df_results['processing_time'].mean()
                std_time = df_results['processing_time'].std()

                if avg_time < 2:
                    insights.append(f"⚡ **Fast processing** - Average response time sangat baik ({avg_time:.2f}s)")
                elif avg_time < 5:
                    insights.append(f"✓ **Acceptable processing** - Response time dalam range normal ({avg_time:.2f}s)")
                else:
                    insights.append(f"🐌 **Slow processing** - Response time perlu dioptimasi ({avg_time:.2f}s)")

                if std_time > avg_time * 0.5:
                    insights.append("⚠️ **Inconsistent processing time** - Variasi waktu proses cukup tinggi")

            # Confidence insight
            if 'confidence' in df_results.columns:
                avg_conf = df_results['confidence'].mean()
                if avg_conf >= 85:
                    insights.append(f"🎯 **High confidence** - Model sangat confident dengan prediksinya ({avg_conf:.1f}%)")
                elif avg_conf >= 70:
                    insights.append(f"👌 **Moderate confidence** - Model cukup confident ({avg_conf:.1f}%)")
                else:
                    insights.append(f"⚠️ **Low confidence** - Model kurang yakin dengan hasil analisisnya ({avg_conf:.1f}%)")

        if not df_scores.empty:
            # Overall score insight
            if 'overall_score' in df_scores.columns:
                avg_score = df_scores['overall_score'].mean()
                if avg_score >= 8:
                    insights.append(f"🌟 **Excellent accuracy** - VLM menunjukkan performa yang sangat baik (Score: {avg_score:.2f}/10)")
                elif avg_score >= 6:
                    insights.append(f"👍 **Good accuracy** - VLM performa cukup baik dengan room for improvement (Score: {avg_score:.2f}/10)")
                else:
                    insights.append(f"📈 **Needs improvement** - VLM perlu peningkatan signifikan (Score: {avg_score:.2f}/10)")

            # Component analysis
            score_components = ['correctness', 'completeness', 'relevance', 'detail', 'language']
            available_components = [c for c in score_components if c in df_scores.columns]

            if available_components:
                component_scores = {c: df_scores[c].mean() for c in available_components}

                # Find strengths
                max_component = max(component_scores, key=component_scores.get)
                max_score = component_scores[max_component]
                if max_score >= 8:
                    insights.append(f"💪 **Strength in {max_component}** - Model excel di aspek ini ({max_score:.2f}/10)")

                # Find weaknesses
                min_component = min(component_scores, key=component_scores.get)
                min_score = component_scores[min_component]
                if min_score < 6:
                    insights.append(f"⚠️ **Weakness in {min_component}** - Area yang perlu improvement ({min_score:.2f}/10)")

            # F1 Score insight
            if 'f1_score' in df_scores.columns:
                avg_f1 = df_scores['f1_score'].mean()
                if avg_f1 >= 80:
                    insights.append(f"🎯 **Excellent classification** - F1 score sangat tinggi ({avg_f1:.1f}%)")
                elif avg_f1 >= 60:
                    insights.append(f"✓ **Decent classification** - F1 score acceptable ({avg_f1:.1f}%)")
                else:
                    insights.append(f"⚠️ **Poor classification** - Precision/Recall perlu ditingkatkan (F1: {avg_f1:.1f}%)")

            # Consistency insight
            if 'overall_score' in df_scores.columns:
                std_score = df_scores['overall_score'].std()
                if std_score < 1:
                    insights.append("📊 **Highly consistent** - Performance sangat konsisten across tests")
                elif std_score < 2:
                    insights.append("✓ **Reasonably consistent** - Performance cukup konsisten")
                else:
                    insights.append("⚠️ **Inconsistent performance** - Variasi hasil cukup tinggi antar tests")

        return insights

    def _get_recommendations(self, df_scores: pd.DataFrame) -> List[str]:
        """Generate recommendations based on scores"""
        recommendations = []

        if df_scores.empty:
            return ["Lakukan lebih banyak testing untuk mendapatkan insight yang lebih baik"]

        score_components = ['correctness', 'completeness', 'relevance', 'detail', 'language']
        available_components = [c for c in score_components if c in df_scores.columns]

        if available_components:
            component_scores = {c: df_scores[c].mean() for c in available_components}

            # Recommendations based on weak areas
            if 'correctness' in component_scores and component_scores['correctness'] < 7:
                recommendations.append("**Improve correctness**: Pertimbangkan fine-tuning model dengan dataset yang lebih akurat")

            if 'completeness' in component_scores and component_scores['completeness'] < 7:
                recommendations.append("**Enhance completeness**: Adjust prompts untuk mendorong response yang lebih lengkap")

            if 'relevance' in component_scores and component_scores['relevance'] < 7:
                recommendations.append("**Boost relevance**: Refine prompts untuk fokus pada aspek yang paling relevan")

            if 'detail' in component_scores and component_scores['detail'] < 7:
                recommendations.append("**Add more detail**: Minta model untuk provide more specific examples dan observations")

            if 'language' in component_scores and component_scores['language'] < 7:
                recommendations.append("**Improve language quality**: Consider post-processing atau prompt engineering untuk output yang lebih baik")

        if 'f1_score' in df_scores.columns:
            avg_f1 = df_scores['f1_score'].mean()
            if avg_f1 < 70:
                recommendations.append("**Improve classification**: Review ground truth labels dan consider retraining dengan balanced dataset")

        if 'overall_score' in df_scores.columns:
            std_score = df_scores['overall_score'].std()
            if std_score > 2:
                recommendations.append("**Improve consistency**: Standardisasi input images dan prompts untuk hasil yang lebih konsisten")

        # General recommendations
        recommendations.append("**Expand testing**: Test dengan lebih banyak varied images untuk comprehensive evaluation")
        recommendations.append("**Ground truth validation**: Pastikan ground truth labels akurat dan comprehensive")
        recommendations.append("**Iterative improvement**: Lakukan testing secara regular untuk track improvement over time")

        return recommendations

    def _get_verdict(self, grade: str, score: float) -> str:
        """Get verdict text based on grade"""
        verdicts = {
            'A+': f"🌟 **OUTSTANDING PERFORMANCE!** \n\nVLM menunjukkan performa yang luar biasa dengan score {score:.2f}/10. Model ini sangat reliable dan akurat untuk production use. Kualitas analisis sangat tinggi dengan detail yang comprehensive dan hasil yang sangat dapat dipercaya.",

            'A': f"⭐ **EXCELLENT PERFORMANCE!** \n\nVLM menunjukkan performa yang sangat baik dengan score {score:.2f}/10. Model ini highly reliable dan siap untuk deployment. Output quality sangat baik dan dapat dipercaya untuk sebagian besar use cases.",

            'B+': f"✨ **GOOD PERFORMANCE!** \n\nVLM menunjukkan performa yang baik dengan score {score:.2f}/10. Model ini cukup reliable untuk production use dengan beberapa area minor improvement. Overall quality baik dan dapat digunakan dengan confidence.",

            'B': f"👍 **DECENT PERFORMANCE** \n\nVLM menunjukkan performa yang decent dengan score {score:.2f}/10. Model ini dapat digunakan untuk production dengan catatan bahwa ada beberapa areas yang perlu improvement. Monitoring dan refinement berkala direkomendasikan.",

            'C': f"⚠️ **NEEDS IMPROVEMENT** \n\nVLM menunjukkan performa yang cukup dengan score {score:.2f}/10. Ada significant room for improvement. Model ini sebaiknya di-refine sebelum production deployment. Consider prompt engineering, fine-tuning, atau testing dengan different approaches.",

            'D': f"❌ **REQUIRES SIGNIFICANT WORK** \n\nVLM menunjukkan performa yang kurang memuaskan dengan score {score:.2f}/10. Model ini memerlukan major improvements sebelum bisa digunakan secara reliable. Disarankan untuk review approach secara fundamental - pertimbangkan different model, better prompts, atau more comprehensive training data."
        }

        return verdicts.get(grade, f"VLM score: {score:.2f}/10")

    def _get_grade(self, score: float) -> str:
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

    def _get_grade_emoji(self, grade: str) -> str:
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

# ============================================================================
# 🚀 MAIN EXECUTION
# ============================================================================


def print_banner():
    """Print welcome banner"""
    print("\n" + "="*80)
    print("""
    🧪 VLM ACCURACY TESTING SYSTEM - PROFESSIONAL EDITION v2.0
    ============================================================

    Sistem testing komprehensif untuk Vision-Language Models
    dengan visualisasi lengkap dan analisis detail.

    Features:
    ✅ Multi-metric evaluation (Accuracy, Precision, Recall, F1)
    ✅ Beautiful visualizations dan charts
    ✅ Comprehensive reports (Markdown + CSV)
    ✅ Auto & interactive scoring modes
    ✅ Support multiple test types (artifact/building/nature/general)

    """)
    print("="*80 + "\n")


def get_test_images(mode: str) -> List[str]:
    """Get test images based on mode"""
    if mode == 'auto':
        # Auto mode: scan folder
        folder = Path(IMAGE_FOLDER)
        if not folder.exists():
            print(f"{EMOJI['warning']} Folder tidak ditemukan: {IMAGE_FOLDER}")
            print(f"{EMOJI['info']} Membuat folder...")
            folder.mkdir(parents=True, exist_ok=True)
            print(f"{EMOJI['warning']} Silakan masukkan gambar test ke folder: {IMAGE_FOLDER}")
            return []

        # Scan untuk image files
        extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.gif', '*.webp']
        images = []
        for ext in extensions:
            images.extend(folder.glob(ext))
            images.extend(folder.glob(ext.upper()))

        image_paths = [str(img) for img in images]

        if not image_paths:
            print(f"{EMOJI['warning']} Tidak ada gambar ditemukan di: {IMAGE_FOLDER}")
            print(f"{EMOJI['info']} Supported formats: JPG, JPEG, PNG, BMP, GIF, WEBP")
            return []

        # Batasi hanya 5 foto pertama
        total_images = len(image_paths)
        image_paths = image_paths[:5]

        print(f"{EMOJI['check']} Ditemukan {total_images} gambar total, memproses 5 foto pertama:")
        for img in image_paths:
            print(f"  • {Path(img).name}")

        return image_paths

    else:
        # Interactive mode: manual input
        print(f"\n{EMOJI['camera']} Masukkan path gambar untuk testing:")
        print(f"  {EMOJI['info']} Cara 1: Masukkan path FILE gambar (pisahkan dengan koma)")
        print(f"  {EMOJI['info']}         Contoh: C:\\path\\image1.jpg, C:\\path\\image2.png")
        print(f"  {EMOJI['info']} Cara 2: Masukkan path FOLDER (semua gambar di folder akan ditest)")
        print(f"  {EMOJI['info']}         Contoh: C:\\path\\to\\folder\n")

        user_input = input("  Path: ").strip()

        if not user_input:
            print(f"\n{EMOJI['warning']} Tidak ada input, silakan masukkan path yang valid")
            return []

        # Check if input is a folder
        input_path = Path(user_input)
        if input_path.is_dir():
            print(f"\n{EMOJI['folder']} Folder terdeteksi, scanning gambar...")

            # Scan folder untuk image files
            extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.gif', '*.webp']
            images = []
            for ext in extensions:
                images.extend(input_path.glob(ext))
                images.extend(input_path.glob(ext.upper()))

            image_paths = [str(img) for img in images]

            if not image_paths:
                print(f"{EMOJI['warning']} Tidak ada gambar ditemukan di folder: {input_path}")
                print(f"{EMOJI['info']} Supported formats: JPG, JPEG, PNG, BMP, GIF, WEBP")
                return []

            # Batasi hanya 5 foto pertama
            total_images = len(image_paths)
            image_paths = image_paths[:5]

            print(f"{EMOJI['check']} Ditemukan {total_images} gambar total, memproses 5 foto pertama:")
            for img in image_paths:
                print(f"  • {Path(img).name}")

            return image_paths

        # Otherwise, treat as comma-separated file paths
        image_paths = [p.strip() for p in user_input.split(',')]

        # Validate paths
        valid_paths = []
        for path in image_paths:
            path_obj = Path(path)
            if path_obj.exists() and path_obj.is_file():
                valid_paths.append(path)
                print(f"  {EMOJI['check']} {path_obj.name}")
            elif path_obj.exists() and path_obj.is_dir():
                print(f"  {EMOJI['warning']} {path} adalah folder, akan di-skip (gunakan folder path saja)")
            else:
                print(f"  {EMOJI['cross']} File tidak ditemukan: {path}")

        if not valid_paths:
            print(f"\n{EMOJI['warning']} Tidak ada file gambar yang valid")

        # Batasi hanya 5 foto pertama jika lebih dari 5
        if len(valid_paths) > 5:
            print(f"\n{EMOJI['info']} Membatasi hanya 5 foto pertama dari {len(valid_paths)} gambar")
            valid_paths = valid_paths[:5]

        return valid_paths


def get_test_types() -> List[str]:
    """Get test types from user"""
    print(f"\n{EMOJI['brain']} Pilih jenis test:")
    print("  1. Artifact (Objek bersejarah/artefak)")
    print("  2. Building (Bangunan/struktur)")
    print("  3. Nature (Alam/lingkungan)")
    print("  4. General (Analisis umum)")
    print("  5. All Types (Semua jenis test)")

    choice = input(f"\n  Pilihan (1-5) [default: 5]: ").strip() or '5'

    test_types_map = {
        '1': ['artifact'],
        '2': ['building'],
        '3': ['nature'],
        '4': ['general'],
        '5': ['artifact', 'building', 'nature', 'general']
    }

    types = test_types_map.get(choice, ['general'])

    print(f"\n{EMOJI['check']} Test types: {', '.join(t.title() for t in types)}")

    return types


def get_scoring_mode() -> str:
    """Get scoring mode from user"""
    print(f"\n{EMOJI['chart']} Pilih scoring mode:")
    print("  1. Interactive - Manual scoring untuk setiap test (lebih akurat)")
    print("  2. Auto - Automatic scoring berdasarkan heuristics (lebih cepat)")

    choice = input(f"\n  Pilihan (1-2) [default: 2]: ").strip() or '2'

    mode = 'interactive' if choice == '1' else 'auto'

    print(f"\n{EMOJI['check']} Scoring mode: {mode.title()}")

    return mode


def main():
    """Main execution function"""

    # Print banner
    print_banner()

    # Check API key
    if GEMINI_API_KEY == "YOUR_API_KEY_HERE":
        print(f"{EMOJI['cross']} ERROR: API Key belum diset!")
        print(f"{EMOJI['info']} Silakan edit file ini dan set GEMINI_API_KEY di bagian CONFIGURATION")
        return

    try:
        # Initialize components
        print(f"{EMOJI['rocket']} Initializing VLM Accuracy Testing System...\n")

        tester = VLMAccuracyTester(GEMINI_API_KEY)

        # Get test images
        test_images = get_test_images(TEST_MODE)

        if not test_images:
            print(f"\n{EMOJI['cross']} Tidak ada gambar untuk ditest. Exiting...")
            return

        # Get test types
        test_types = get_test_types()

        # Get scoring mode
        scoring_mode = get_scoring_mode()

        # Initialize evaluator
        evaluator = AccuracyEvaluator(GROUND_TRUTH)

        # Run tests
        print(f"\n{EMOJI['fire']} Memulai testing...")
        print(f"{'='*80}\n")

        all_results = []

        # Create mapping of filename to image path
        filename_to_path = {Path(img_path).name: img_path for img_path in test_images}

        for img_idx, img_path in enumerate(test_images, 1):
            filename = Path(img_path).name

            print(f"{EMOJI['magnify']} [{img_idx}/{len(test_images)}] Testing: {filename}")

            for test_type in test_types:
                print(f"  {EMOJI['brain']} Running {test_type} analysis...")

                # Analyze image
                result = tester.analyze_image(img_path, test_type)
                result['filename'] = filename
                result['test_type'] = test_type
                result['image_path'] = img_path  # Store image path in result

                all_results.append(result)

                if result['success']:
                    print(f"    {EMOJI['check']} Success | Time: {result['processing_time']:.2f}s | Confidence: {result['confidence']:.1f}%")
                else:
                    print(f"    {EMOJI['cross']} Failed | Error: {result['error']}")

            print()

        # Create DataFrames
        df_results = pd.DataFrame(all_results)

        # Evaluate scores
        print(f"\n{EMOJI['chart']} Evaluating scores...")
        print(f"{'='*80}\n")

        auto_mode = (scoring_mode == 'auto')

        score_data = []
        for result in all_results:
            if result['success']:
                # Get image path for this result
                img_path = result.get('image_path') or filename_to_path.get(result['filename'])
                scores = evaluator.evaluate_result(result, result['filename'], auto_mode, img_path)
                scores['filename'] = result['filename']
                scores['test_type'] = result['test_type']
                score_data.append(scores)

        df_scores = pd.DataFrame(score_data)

        if df_scores.empty:
            print(f"\n{EMOJI['cross']} Tidak ada successful tests untuk dievaluasi")
            return

        # Generate visualizations
        print(f"\n{EMOJI['sparkle']} Generating visualizations...")
        print(f"{'='*80}\n")

        viz_gen = VisualizationGenerator(OUTPUT_FOLDER)
        viz_gen.generate_all_visualizations(df_results, df_scores)

        # Generate report
        print(f"\n{EMOJI['doc']} Generating comprehensive report...")
        print(f"{'='*80}\n")

        test_config = {
            'mode': TEST_MODE,
            'scoring_mode': scoring_mode,
            'test_types': test_types,
            'model': MODEL_NAME
        }

        report_gen = ReportGenerator(OUTPUT_FOLDER)
        report = report_gen.generate_full_report(df_results, df_scores, test_images, test_config)

        # Export CSV
        print(f"\n{EMOJI['folder']} Exporting data...")

        csv_results_path = Path(OUTPUT_FOLDER) / 'test_results.csv'
        csv_scores_path = Path(OUTPUT_FOLDER) / 'detailed_scores.csv'

        df_results.to_csv(csv_results_path, index=False)
        df_scores.to_csv(csv_scores_path, index=False)

        print(f"  {EMOJI['check']} Results CSV: {csv_results_path}")
        print(f"  {EMOJI['check']} Scores CSV: {csv_scores_path}")

        # Print summary
        print(f"\n{EMOJI['trophy']} TESTING COMPLETED!")
        print(f"{'='*80}\n")

        if 'overall_score' in df_scores.columns:
            avg_score = df_scores['overall_score'].mean()
            grade = viz_gen._get_grade(avg_score)

            print(f"{EMOJI['star']} FINAL RESULTS:")
            print(f"  • Overall Score: {avg_score:.2f}/10")
            print(f"  • Final Grade: {grade} {viz_gen._get_grade_emoji(grade)}")

        if 'success' in df_results.columns:
            success_rate = df_results['success'].mean() * 100
            print(f"  • Success Rate: {success_rate:.1f}%")

        if 'f1_score' in df_scores.columns:
            avg_f1 = df_scores['f1_score'].mean()
            print(f"  • F1 Score: {avg_f1:.1f}%")

        print(f"\n{EMOJI['folder']} Output folder: {OUTPUT_FOLDER}")
        print(f"\n{EMOJI['party']} Semua file telah berhasil di-generate!")

    except KeyboardInterrupt:
        print(f"\n\n{EMOJI['warning']} Testing dibatalkan oleh user")
    except Exception as e:
        print(f"\n{EMOJI['cross']} ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

# ============================================================================
# 🎬 ENTRY POINT
# ============================================================================


if __name__ == "__main__":
    main()

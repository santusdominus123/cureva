# 🧪 VLM Accuracy Testing System - User Guide

## 📋 Deskripsi

Script professional untuk menghitung akurasi Vision-Language Model (VLM) dengan output yang mudah dimengerti, visualisasi lengkap, dan preview gambar interaktif.

## ✨ Features

- ✅ **Multi-metric evaluation**: Accuracy, Precision, Recall, F1, Confidence
- ✅ **Preview gambar interaktif** saat evaluasi (Interactive mode)
- ✅ **Beautiful visualizations**: 4 file PNG dengan 20+ charts
- ✅ **Comprehensive reports**: Markdown report + CSV exports
- ✅ **Auto & Interactive scoring modes**
- ✅ **Support folder input**: Langsung masukkan path folder
- ✅ **Multiple test types**: Artifact, Building, Nature, General
- ✅ **Error handling robust**: User-friendly error messages

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install google-generativeai pillow pandas matplotlib seaborn numpy
```

### 2. Set API Key

Edit file `vlm_accuracy_test.py` baris 36:

```python
GEMINI_API_KEY = "your-actual-gemini-api-key-here"
```

### 3. Run Script

```bash
python vlm_accuracy_test.py
```

### 4. Follow Prompts

**Input Path Gambar:**
- **Cara 1**: Masukkan path **FOLDER** (semua gambar akan ditest)
  ```
  Path: C:\Users\YourName\Desktop\test_images
  ```

- **Cara 2**: Masukkan path **FILE** individual (pisahkan dengan koma)
  ```
  Path: C:\path\image1.jpg, C:\path\image2.png
  ```

**Pilih Test Type:**
- 1: Artifact (candi, patung, artefak bersejarah)
- 2: Building (bangunan, struktur)
- 3: Nature (alam, lingkungan)
- 4: General (analisis umum)
- 5: All Types (semua test type)

**Pilih Scoring Mode:**
- 1: Interactive - Manual scoring (lebih akurat, **preview gambar otomatis muncul**)
- 2: Auto - Automatic scoring (lebih cepat)

## 🎯 Interactive Mode dengan Preview Gambar

Saat Anda memilih **Interactive mode**, script akan:

1. ✅ **Membuka window preview gambar** menggunakan matplotlib
2. ✅ Menampilkan gambar yang sedang dievaluasi
3. ✅ Menampilkan info gambar (size, format)
4. ✅ Meminta Anda untuk scoring (1-10) untuk setiap aspek
5. ✅ **Otomatis menutup window** setelah scoring selesai

**Contoh Output:**
```
======================================================================
🔍 EVALUASI: WhatsApp Image 2025-10-17 at 21.56.50.jpg
======================================================================

📷 ========================================
📷 PREVIEW GAMBAR DIBUKA DI WINDOW TERPISAH
📷 ========================================
ℹ️ Silakan lihat window matplotlib untuk melihat gambar yang sedang dievaluasi
ℹ️ Window akan otomatis tertutup setelah Anda selesai scoring

📄 HASIL ANALISIS VLM:
----------------------------------------------------------------------
{
  "object_type": "candi",
  "condition": "baik",
  "damage_level": "low",
  ...
}
----------------------------------------------------------------------

📊 Berikan penilaian untuk setiap aspek (skala 1-10):

  ✅ 1. Kebenaran/Correctness (1-10): 8
  ⭐ 2. Kelengkapan/Completeness (1-10): 9
  🎯 3. Relevansi/Relevance (1-10): 8
  🔍 4. Kualitas Detail (1-10): 7
  📄 5. Kualitas Bahasa (1-10): 9

🏆 Overall Score: 8.25/10
📊 F1 Score: 85.0%
```

## 📊 Output Files

Semua file tersimpan di folder `./vlm_test_results/`:

### 1. **Visualizations** (PNG)
- `overview_dashboard.png` - Dashboard dengan 12 charts
- `performance_charts.png` - Analisis performa detail (6 charts)
- `score_distributions.png` - Distribusi score (6 histograms)
- `comparison_charts.png` - Perbandingan antar tests (4 charts)

### 2. **Reports** (Markdown)
- `VLM_Accuracy_Report.md` - Laporan lengkap dengan:
  - Executive Summary
  - Performance Metrics
  - Accuracy Metrics
  - Detailed Test Results
  - Insights & Recommendations
  - Final Grade (A+ hingga D)

### 3. **Data Exports** (CSV)
- `test_results.csv` - Raw test results
- `detailed_scores.csv` - Detailed scoring data

## 📈 Metrics yang Diukur

### Accuracy Metrics (1-10 scale)
- **Correctness**: Kebenaran identifikasi dan analisis
- **Completeness**: Kelengkapan informasi
- **Relevance**: Relevansi dengan pertanyaan
- **Detail Quality**: Kualitas dan kedalaman detail
- **Language Quality**: Kualitas bahasa dan presentasi
- **Overall Score**: Weighted average dari semua metrics

### Classification Metrics (%)
- **Precision**: Akurasi prediksi positif
- **Recall**: Kemampuan mendeteksi semua kasus positif
- **F1 Score**: Harmonic mean dari precision dan recall

### Performance Metrics
- **Success Rate**: Persentase test yang berhasil
- **Processing Time**: Waktu proses per gambar
- **Confidence Score**: Tingkat keyakinan model

## 🎓 Advanced Configuration

Edit bagian CONFIGURATION di `vlm_accuracy_test.py`:

```python
# 1. API KEY
GEMINI_API_KEY = "your-api-key"

# 2. MODEL
MODEL_NAME = "gemini-2.0-flash-exp"

# 3. MODE TESTING
TEST_MODE = 'interactive'  # atau 'auto'

# 4. FOLDER GAMBAR (untuk mode auto)
IMAGE_FOLDER = "./test_images"

# 5. GROUND TRUTH (optional)
GROUND_TRUTH = {
    "candi1.jpg": {
        "type": "candi",
        "condition": "sedang",
        "damage_level": "medium"
    },
}

# 6. OUTPUT FOLDER
OUTPUT_FOLDER = "./vlm_test_results"
```

## 🐛 Troubleshooting

### Error: "Permission denied"
**Masalah**: Anda memberikan path folder, tapi script versi lama mengira itu file.
**Solusi**: Gunakan script versi terbaru yang sudah support folder input.

### Error: "API Key not set"
**Masalah**: API key belum diset.
**Solusi**: Edit file dan set `GEMINI_API_KEY` di baris 36.

### Preview gambar tidak muncul
**Masalah**: Matplotlib backend issue.
**Solusi**:
```bash
pip install --upgrade matplotlib
```
Atau set backend di awal script:
```python
import matplotlib
matplotlib.use('TkAgg')  # atau 'Qt5Agg'
```

### Script terlalu lambat
**Masalah**: Terlalu banyak gambar atau test types.
**Solusi**:
- Gunakan **Auto mode** untuk scoring otomatis
- Kurangi jumlah test types
- Test gambar secara batch

## 💡 Tips

1. **Untuk hasil terbaik**: Gunakan **Interactive mode** dan berikan scoring yang objektif
2. **Untuk batch testing**: Gunakan **Auto mode** dan set ground truth
3. **Untuk evaluasi cepat**: Pilih 1 test type yang paling relevan
4. **Preview gambar**: Sangat membantu untuk scoring yang akurat di Interactive mode
5. **Ground truth**: Semakin lengkap ground truth, semakin akurat evaluation metrics

## 📞 Support

Jika ada pertanyaan atau issues:
1. Check error message di console
2. Pastikan semua dependencies terinstall
3. Pastikan API key valid
4. Pastikan path gambar benar dan file adalah gambar yang valid

## 🎉 Version History

### v2.0 (Current)
- ✅ Added image preview during interactive scoring
- ✅ Support folder input directly
- ✅ Better error handling
- ✅ User-friendly error messages
- ✅ Auto-close preview window after scoring

### v1.0
- Initial release with basic functionality

---

**Made with ❤️ for CureVa Team**
*Professional VLM Accuracy Testing System v2.0*

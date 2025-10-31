# Struktur Proyek Cureva

## 📁 Struktur Direktori

```
cureva/
├── src/                          # Source code aplikasi
│   ├── components/              # React components
│   │   ├── dashboard/          # Dashboard widgets
│   │   └── navigation/         # Navigation components
│   ├── pages/                  # Page components
│   │   └── auth/              # Authentication pages
│   ├── services/              # API services & business logic
│   ├── lib/                   # Firebase & database configs
│   ├── utils/                 # Utility functions
│   ├── types/                 # TypeScript type definitions
│   ├── examples/              # Example implementations
│   ├── assets/                # Images & static assets
│   ├── gaussian-splats-demo/  # 3D Gaussian Splats library
│   └── introbg/               # Intro background images
│
├── public/                      # Static public files
│   ├── libs/                   # External libraries (three.js, gaussian-splats)
│   └── sample/                 # Sample files
│
├── python_tools/               # Python scripts & tools
│   ├── drone_controller.py     # Main drone controller
│   ├── drone_controller_gui.py # GUI version
│   ├── drone_sam_tracker.py    # SAM integration
│   └── requirements.txt        # Python dependencies
│
├── scripts/                    # Build & setup scripts
│   ├── build/                 # Build scripts
│   │   ├── build-for-hosting.sh
│   │   ├── prepare-build.cjs
│   │   └── fix-gaussian-viewer.cjs
│   └── setup/                 # Setup scripts
│
├── docs/                       # Documentation & configs
│   ├── firestore.example.json  # Firestore config example
│   ├── firestore.rules         # Firestore security rules
│   └── .env.example           # Environment variables example
│
├── server-side/               # Server-side code
├── dist/                      # Production build output
└── node_modules/              # Node dependencies

```

## 🔧 Pembersihan yang Dilakukan

### ✅ File Duplikat yang Dihapus:
1. **GaussianSplats3D Library** - Menghapus 2 dari 3 copy (menghemat ~6.4MB)
   - ❌ `.claude/GaussianSplats3D-main/` (deleted)
   - ❌ `src/pages/GaussianSplats3D-main/` (deleted)
   - ✅ `src/gaussian-splats-demo/` (kept)

2. **Compiled JS Files** - Menghapus semua file transpiled
   - ❌ `src/components/dist/`
   - ❌ `src/lib/dist/`
   - ❌ `src/pages/dist/`
   - ❌ `src/types/dist/`

3. **Drone Controller Files** - Konsolidasi ke python_tools/
   - ❌ `drone_controller_glass.py`
   - ❌ `drone_controller_optimized.py`
   - ❌ `drone_minimal.py`
   - ✅ Semua file drone dipindah ke `python_tools/`

4. **Navigation Components** - Hanya simpan versi final
   - ❌ `BottomNavigationNew.tsx`
   - ❌ `BottomNavigationFinal.tsx`
   - ❌ `SidebarNew.tsx`
   - ✅ `BottomNavigation.tsx` (kept)
   - ✅ `Sidebar.tsx` (kept)

5. **VLM Components** - Simpan versi Enhanced
   - ❌ `VLMAnalyzer.tsx`
   - ❌ `vlmService.ts`
   - ✅ `VLMAnalyzerEnhanced.tsx` (kept)
   - ✅ `vlmServiceEnhanced.ts` (kept)

6. **App Component**
   - ❌ `App.tsx` (old)
   - ✅ `AppFixed.tsx` → renamed to `App.tsx`

### 🗑️ Temporary Files Dihapus:
- Cache directories: `__pycache__/`, `.dist/`
- Test files: `test_deps.py`, `test_simple.py`
- VLM test files: `vlm_accuracy_test.*`
- Output directories: `outputs/`, `uploads/`, `sam_output/`, `vlm_test_results/`
- Temporary docs: `INSTALL_REQUIREMENTS.txt`, `TELLO_WIFI_SETUP.md`, dll.

## 📋 Ringkasan
- **Total file duplikat dihapus**: ~20+ files
- **Space saved**: ~10MB+ (tidak termasuk node_modules)
- **Struktur folder**: Lebih terorganisir dan modular
- **Maintenance**: Lebih mudah dengan struktur yang jelas

## 🚀 Cara Menggunakan

### Development
```bash
npm install
npm run dev
```

### Build Production
```bash
cd scripts/build
./build-for-hosting.sh
```

### Python Tools
```bash
cd python_tools
pip install -r requirements.txt
python drone_controller.py
```

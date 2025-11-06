# 🌟 Cureva - Advanced 3D Vision Platform

<div align="center">

![Version](https://img.shields.io/badge/version-Beta-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

### *Full-Stack 3D Vision Platform with AI Integration*

Production-ready web platform yang mengintegrasikan Google Gemini AI, Firebase, dan advanced 3D rendering untuk transformasi objek fisik menjadi model 3D interaktif.

[Live Demo](#) • [Documentation](#) • [API Reference](#)

</div>

---

## 🚀 Full-Stack Technology Stack

### **Front-End Architecture**
- **Core:** React 18 + TypeScript + Vite (ES6+)
- **Styling:** Tailwind CSS 3.4.17 (Utility-first CSS framework)
- **3D Graphics:** Three.js + React Three Fiber + Gaussian Splats 3D
- **State Management:** React Hooks + Firebase Realtime Sync
- **Routing:** React Router DOM v6
- **UI Components:** Custom component library dengan Lucide React icons

### **Back-End & Cloud Services**
- **BaaS Platform:** Firebase (Authentication, Firestore, Cloud Storage)
- **AI Integration:** Google Gemini 2.0 Flash (Vision & Multimodal AI)
- **Real-time Database:** Cloud Firestore dengan real-time listeners
- **File Storage:** Firebase Storage untuk 3D assets & image processing
- **Authentication:** Multi-provider (Email, Google OAuth, GitHub)

### **API Integrations**
- ✅ **Google Gemini AI API** - Advanced vision analysis & 3D reconstruction
- ✅ **Firebase REST API** - Cloud storage & database operations
- ✅ **Google OAuth 2.0** - Secure authentication flow
- ✅ **Custom Service Layer** - nanoBananaService, VLM Service, Drone Service

### **Development Tools & Workflows**
- **Build Tool:** Vite 5.2 (Lightning-fast HMR)
- **Linting:** ESLint with TypeScript + React plugins
- **Code Quality:** TypeScript 5.5+ strict mode
- **Package Manager:** npm/pnpm
- **Version Control:** Git with conventional commits

---

## 💼 Professional Implementation Highlights

### 🔗 **API & Third-Party Integrations**
```typescript
// Google Gemini AI Integration for 3D Analysis
✓ Real-time vision analysis dengan Gemini 2.0 Flash
✓ Automatic damage detection & quality assessment
✓ AI-powered reconstruction recommendations

// Firebase Cloud Integration
✓ Secure user authentication & authorization
✓ Real-time data synchronization across devices
✓ Scalable cloud storage untuk 3D models & photos
✓ Server-side timestamps & metadata management
```

### 🎯 **Advanced Features Implementation**

#### 1️⃣ **RESTful Service Architecture**
```typescript
// Service Layer Pattern with TypeScript
class NanoBananaService {
  - Google Generative AI SDK integration
  - Base64 image processing & conversion
  - JSON response parsing & validation
  - Error handling & logging
  - Async/await pattern implementation
}

// Firebase Service with Real-time Capabilities
- uploadImageToFirebase(): Promise<string>
- saveDatasetToFirestore(dataset): Promise<DocumentReference>
- listenToDataset(): Real-time snapshot listener
- getUserDatasets(): Query with where clauses
```

#### 2️⃣ **Authentication & Security**
```typescript
✓ Multi-provider OAuth (Google, GitHub, Email/Password)
✓ Firebase Auth persistence (browserLocalPersistence)
✓ Protected routes dengan authentication guards
✓ Secure environment variable management (.env)
✓ API key protection & validation
```

#### 3️⃣ **Real-time Data Synchronization**
```typescript
✓ Firestore onSnapshot listeners untuk live updates
✓ Optimistic UI updates dengan local state
✓ Server-side timestamp management
✓ Conflict resolution strategies
✓ Offline-first architecture support
```

#### 4️⃣ **File Upload & Cloud Storage**
```typescript
✓ Multi-format file upload (images, 3D models)
✓ Base64 to Blob conversion
✓ Firebase Storage integration
✓ Progress tracking & error handling
✓ Download URL generation & management
```

---

## 🎨 Core Features

### 📸 **Smart 3D Scanning & Processing**
- Browser-based 3D capture dengan guided workflow
- Multi-angle photo collection system
- Real-time preview & validation
- Automatic quality assessment

### 🔮 **Gaussian Splatting Renderer**
- WebGL-based photorealistic rendering
- Three.js integration untuk high-performance 3D
- Custom shader implementation
- Mobile-optimized rendering pipeline

### 🤖 **AI-Powered Vision Analysis**
- Google Gemini 2.0 Flash integration
- Automatic damage detection & analysis
- Quality assessment & recommendations
- Multimodal AI processing (text + vision)

### 🎮 **Interactive 3D Viewer**
- React Three Fiber canvas implementation
- OrbitControls untuk smooth navigation
- Multiple viewer modes (Blender-like, Debug, Enhanced)
- Screenshot capture dengan WebGL rendering

### 🚁 **Drone Integration Service**
- Custom droneService API layer
- Camera control & telemetry
- Aerial photogrammetry support
- Real-time connection status

### 📱 **Responsive Design**
- Mobile-first Tailwind CSS implementation
- Adaptive layouts untuk semua screen sizes
- Touch-optimized controls
- Progressive Web App ready

---

## 🏗️ Project Architecture

```
cureva/
├── src/
│   ├── components/
│   │   ├── features/      # Feature components (VLM, FileUpload)
│   │   ├── ui/            # Reusable UI components
│   │   └── viewers/       # 3D viewer implementations
│   ├── pages/
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Main dashboard
│   │   ├── demos/         # Feature demos
│   │   └── tools/         # 3D tools (Viewer3D, ExportHub)
│   ├── services/
│   │   ├── nanoBananaService.ts    # AI reconstruction service
│   │   ├── vlmServiceEnhanced.ts   # Vision-Language model
│   │   └── droneService.ts         # Drone integration
│   ├── lib/
│   │   ├── firebase.tsx            # Firebase configuration
│   │   └── firestore.ts            # Firestore helpers
│   ├── types/
│   │   ├── database.ts             # Type definitions
│   │   └── firestore.ts            # Firestore types
│   └── utils/                      # Utility functions
└── public/                         # Static assets
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ dan npm/pnpm
- Firebase project dengan Auth, Firestore, Storage enabled
- Google Gemini API key

### Installation

```bash
# Clone repository
git clone https://github.com/santusdominus123/cureva.git
cd cureva

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan API keys Anda

# Run development server
npm run dev
```

Akses `http://localhost:5173` di browser

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📊 Technical Expertise Demonstrated

### Front-End Skills
✅ Proficient in **HTML5, CSS3, JavaScript ES6+**
✅ Expert in **React 18** dengan TypeScript
✅ Advanced **Tailwind CSS** implementation
✅ Custom **React Hooks** & state management
✅ **Three.js** & WebGL 3D graphics programming

### Back-End Skills
✅ **Node.js/TypeScript** service architecture
✅ **Firebase** Backend-as-a-Service implementation
✅ RESTful **API design & integration**
✅ Real-time database dengan **Firestore**
✅ Cloud **Storage** & file management

### Integration & APIs
✅ **Google Gemini AI API** - Vision & multimodal AI
✅ **Firebase Authentication** - Multi-provider OAuth
✅ **Cloud Firestore** - Real-time NoSQL database
✅ **Firebase Storage** - Cloud file storage
✅ Custom service layer architecture

---

## 🧪 Code Quality & Best Practices

```typescript
✓ TypeScript strict mode untuk type safety
✓ ESLint configuration dengan React & TypeScript rules
✓ Component-based architecture dengan separation of concerns
✓ Custom hooks untuk reusable logic
✓ Error boundaries & fallback UI
✓ Environment-based configuration (.env)
✓ Git workflow dengan conventional commits
```

---

## 🎯 Use Cases & Applications

**🏗️ Construction & Architecture**
- Site documentation & progress tracking
- As-built 3D models generation
- Spatial measurements & quality control

**🎨 Digital Content Creation**
- 3D asset digitization
- Reference models untuk game development
- Virtual showroom & product visualization

**📚 Education & Research**
- Interactive learning materials
- Cultural heritage preservation
- Scientific documentation

**🏢 Enterprise Solutions**
- Remote inspection & collaboration
- Digital twin creation
- Quality assurance workflows

---

## 🛣️ Development Roadmap

### Phase 1: Core Platform (✅ Completed)
- [x] React + TypeScript setup dengan Vite
- [x] Firebase Authentication & Firestore integration
- [x] Google Gemini AI API integration
- [x] 3D viewer implementations (Multiple variants)
- [x] Real-time data synchronization
- [x] Responsive UI dengan Tailwind CSS

### Phase 2: Advanced Features (🚧 In Progress)
- [x] AI-powered damage detection
- [x] Gaussian Splats rendering
- [x] Drone camera integration
- [ ] Multi-format export (GLB, FBX, OBJ)
- [ ] Advanced measurement tools
- [ ] Collaborative editing features

### Phase 3: Scale & Production (📋 Planned)
- [ ] REST API development untuk third-party integration
- [ ] Performance optimization & caching strategies
- [ ] CDN integration untuk global delivery
- [ ] Analytics & monitoring dashboard
- [ ] Native mobile apps (React Native)
- [ ] AR/VR preview modes

---

## 💡 Key Technical Achievements

### Performance Optimization
```typescript
✓ Lazy loading untuk 3D components
✓ Code splitting dengan React.lazy()
✓ Optimized bundle size dengan Vite tree-shaking
✓ WebGL rendering optimization
✓ Image compression & progressive loading
```

### Scalability
```typescript
✓ Serverless architecture dengan Firebase
✓ Auto-scaling cloud infrastructure
✓ Efficient database queries dengan indexes
✓ CDN-ready static asset structure
```

### Developer Experience
```typescript
✓ Hot Module Replacement (HMR) dengan Vite
✓ TypeScript IntelliSense & autocomplete
✓ Comprehensive type definitions
✓ Modular & maintainable codebase
✓ Clear documentation & comments
```

---

## 🤝 Contributing

Contributions welcome! Untuk berkontribusi:

1. Fork repository ini
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📧 Contact & Support

**Developer:** Santus Dominus
**GitHub:** [@santusdominus123](https://github.com/santusdominus123)
**Email:** [Contact via GitHub](https://github.com/santusdominus123)

**Project Repository:** [github.com/santusdominus123/cureva](https://github.com/santusdominus123/cureva)

---

## 🙏 Acknowledgments

- **Three.js** - 3D graphics library
- **Firebase** - Backend infrastructure
- **Google Gemini AI** - Vision & AI capabilities
- **React Team** - UI framework
- **Tailwind CSS** - Utility-first CSS framework

---

<div align="center">

### 🌟 Built with Modern Web Technologies

**Full-Stack • TypeScript • React • Firebase • AI Integration**

*Demonstrating professional web development expertise with production-ready code quality*

---

⭐ **Star this repo** if you find it useful!

[Report Bug](https://github.com/santusdominus123/cureva/issues) • [Request Feature](https://github.com/santusdominus123/cureva/issues) • [Documentation](#)

</div>

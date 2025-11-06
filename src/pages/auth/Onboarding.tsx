import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Sparkles, ScanLine, FolderOpen, Share2, ArrowRight } from "lucide-react";
import BackgroundImage from "../../components/ui/BackgroundImage";

const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      title: "Welcome to Cureva",
      subtitle: "AI-Powered 3D Vision Platform",
      description: "Membangun masa depan pelestarian budaya dengan teknologi 3D terkini",
      icon: Sparkles,
      color: "from-blue-500 via-blue-600 to-indigo-600",
    },
    {
      title: "Pindai Cagar Budaya",
      subtitle: "Real-time 3D Scanning",
      description: "Tangkap detail presisi dengan AI. Dokumentasi digital yang sempurna untuk warisan budaya",
      icon: ScanLine,
      color: "from-purple-500 via-purple-600 to-pink-600",
    },
    {
      title: "Kelola Proyek",
      subtitle: "Smart Management System",
      description: "Dashboard terpusat untuk semua proyek 3D. Kelola, analisis, dan optimalkan hasil pemindaian",
      icon: FolderOpen,
      color: "from-pink-500 via-pink-600 to-rose-600",
    },
    {
      title: "Bagikan & Ekspor",
      subtitle: "Share & Export Anywhere",
      description: "Export ke berbagai format 3D atau bagikan via cloud. Kolaborasi tanpa batas",
      icon: Share2,
      color: "from-orange-500 via-orange-600 to-red-600",
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 50);
    } else {
      // Navigate to login after last step
      navigate("/login");
    }
  };

  const handleSkip = () => {
    navigate("/login");
  };

  const handleDotClick = (index: number) => {
    if (index !== currentStep) {
      setTimeout(() => setCurrentStep(index), 50);
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden flex flex-col">
      {/* Optimized Background Image with Preloading */}
      <BackgroundImage
        src="/src/introbg/Generated Image October 20, 2025 - 10_20PM.png"
        alt="Cureva Onboarding Background"
        overlayClassName="bg-gradient-to-b from-black/70 via-black/60 to-black/80"
      />

      {/* Container for animated orbs */}
      <div className="absolute inset-0">
        {/* Animated Color Orbs for visual interest */}
        <div
          className={`absolute top-20 -left-40 w-80 h-80 bg-gradient-to-r ${currentStepData.color} rounded-full mix-blend-screen filter blur-3xl opacity-10 transition-all duration-1000 ease-in-out`}
          style={{ animation: "float 20s ease-in-out infinite" }}
        ></div>
        <div
          className={`absolute top-40 -right-40 w-80 h-80 bg-gradient-to-l ${currentStepData.color} rounded-full mix-blend-screen filter blur-3xl opacity-10 transition-all duration-1000 ease-in-out`}
          style={{ animation: "float 25s ease-in-out infinite reverse" }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header - Compact & Clean */}
        <div className="flex justify-between items-center px-4 py-2 flex-shrink-0">
          {/* Logo Partnership - Compact */}
          <div className="flex items-center gap-1.5">
            <img
              src="/src/assets/logos/pkm.png"
              alt="PKM"
              className="h-6 w-auto object-contain bg-white/95 rounded-md px-1 py-0.5 shadow-lg hover:scale-105 transition-transform duration-300 ease-out"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <img
              src="/src/assets/logos/dikti.png"
              alt="Dikti"
              className="h-6 w-auto object-contain bg-white/95 rounded-md px-1 py-0.5 shadow-lg hover:scale-105 transition-transform duration-300 ease-out"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <img
              src="/src/assets/logos/twh.png"
              alt="TWH"
              className="h-6 w-auto object-contain bg-white/95 rounded-full p-0.5 shadow-lg hover:scale-105 transition-transform duration-300 ease-out"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>

          {/* Skip Button */}
          <button onClick={handleSkip} className="text-xs text-slate-400 hover:text-white font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-300 ease-out">
            Skip
          </button>
        </div>

        {/* Center Content Area */}
        <div className="flex-1 flex items-center justify-center px-4 py-2">
          <div className="w-full max-w-lg">
            {/* Content Card with smooth slide animation */}
            <div key={currentStep} className="animate-slide-in-smooth">
              {/* Icon with Gradient Background */}
              <div className="flex justify-center mb-3">
                <div className="relative group">
                  {/* Icon Container */}
                  <div
                    className={`
                    relative z-10
                    p-4 rounded-xl
                    bg-gradient-to-br ${currentStepData.color}
                    shadow-2xl shadow-slate-900/50
                    transition-all duration-700 ease-out
                    group-hover:scale-110 group-hover:rotate-3
                  `}
                  >
                    <Icon className="w-10 h-10 text-white transition-transform duration-500" strokeWidth={2} />
                  </div>

                  {/* Glow Effect */}
                  <div
                    className={`
                    absolute inset-0 rounded-xl
                    bg-gradient-to-br ${currentStepData.color}
                    blur-xl opacity-40 group-hover:opacity-60
                    transition-all duration-700 ease-out
                  `}
                    style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
                  ></div>
                </div>
              </div>

              {/* Text Content - Tight Hierarchy */}
              <div className="text-center space-y-1 mb-4">
                {/* Subtitle First - Small & Muted */}
                <p
                  className={`
                  text-[10px] font-semibold uppercase tracking-wider
                  bg-gradient-to-r ${currentStepData.color}
                  bg-clip-text text-transparent
                  animate-fade-in-up
                  transition-all duration-500 ease-out
                `}
                >
                  {currentStepData.subtitle}
                </p>

                {/* Main Title - Large & Bold */}
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight animate-fade-in-up animation-delay-100 transition-all duration-500 ease-out">{currentStepData.title}</h1>

                {/* Description - Close to Title */}
                <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto pt-1 animate-fade-in-up animation-delay-200 transition-all duration-500 ease-out">{currentStepData.description}</p>
              </div>

              {/* Progress Indicators - Minimal */}
              <div className="flex justify-center items-center gap-1.5 mb-4">
                {steps.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className={`
                      transition-all duration-500 ease-out rounded-full
                      ${index === currentStep ? `w-6 h-1.5 bg-gradient-to-r ${currentStepData.color} shadow-lg scale-110` : "w-1.5 h-1.5 bg-slate-700 hover:bg-slate-600 hover:scale-125"}
                    `}
                    aria-label={`Go to step ${index + 1}`}
                  />
                ))}
              </div>

              {/* CTA Button - Professional */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleNext}
                  className={`
                    group relative
                    w-full sm:w-auto
                    px-6 py-3 rounded-xl
                    bg-gradient-to-r ${currentStepData.color}
                    text-white font-semibold text-sm
                    shadow-xl shadow-slate-900/50
                    hover:shadow-2xl
                    transform hover:scale-105 active:scale-95
                    transition-all duration-300 ease-out
                    overflow-hidden
                  `}
                >
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                  <span className="relative flex items-center justify-center gap-2">
                    <span>{currentStep === steps.length - 1 ? "Get Started" : "Continue"}</span>
                    {currentStep === steps.length - 1 ? (
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    ) : (
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    )}
                  </span>
                </button>

                {/* Step Counter */}
                <p className="text-[10px] text-slate-500 font-medium transition-all duration-300">
                  {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-2 px-4 flex-shrink-0">
          <p className="text-[10px] text-slate-500 text-center">© 2025 Cureva · Program Kreativitas Mahasiswa</p>
        </div>
      </div>

      {/* Enhanced Smooth Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.05);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.95);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-smooth {
          from {
            opacity: 0;
            transform: translateX(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animation-delay-100 {
          animation-delay: 0.15s;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 0.3s;
          opacity: 0;
        }

        .animate-slide-in-smooth {
          animation: slide-in-smooth 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;

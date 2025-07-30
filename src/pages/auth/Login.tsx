import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  ScanLineIcon,
  FolderIcon,
  ShareIcon,
} from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const slides = [
  {
    icon: <ScanLineIcon size={48} className="text-blue-400" />,
    title: 'Pindai Cagar Budaya',
    body: 'Arahkan kamera ke situs atau artefak, lalu biarkan Cureva buatkan model 3D otomatis.',
  },
  {
    icon: <FolderIcon size={48} className="text-purple-400" />,
    title: 'Kelola Proyek',
    body: 'Simpan & kelola semua hasil pemindaian dalam satu tempat.',
  },
  {
    icon: <ShareIcon size={48} className="text-green-400" />,
    title: 'Bagikan & Ekspor',
    body: 'Ekspor ke berbagai format atau bagikan tautan interaktif.',
  },
];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  /* ---------- Intro Onboarding ---------- */
  const [showIntro, setShowIntro] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem('cureva-intro-seen') === 'true';
    setShowIntro(!seen);
  }, []);

  const finishIntro = () => {
    localStorage.setItem('cureva-intro-seen', 'true');
    setShowIntro(false);
  };

  /* ---------- Login Form ---------- */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(); // mock login
  };

  /* ---------- Render ---------- */
  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
        {/* Logo */}
        <div className="pt-8">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Cureva
          </h1>
          <p className="text-sm text-gray-300 mt-1 text-center">
            Melestarikan masa lalu, membangun masa depan.
          </p>
        </div>

        {/* Slide */}
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs">
          {slides[step].icon}
          <h2 className="text-xl font-bold mt-4">{slides[step].title}</h2>
          <p className="text-gray-300 mt-2 text-sm">{slides[step].body}</p>
        </div>

        {/* Indikator & CTA */}
        <div className="w-full max-w-xs pb-8">
          <div className="flex justify-center space-x-2 mb-4">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-blue-400' : 'w-1.5 bg-gray-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => (step < slides.length - 1 ? setStep(step + 1) : finishIntro())}
            className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {step < slides.length - 1 ? (
              <>
                Lanjut <ArrowRightIcon className="ml-2" size={18} />
              </>
            ) : (
              'Mulai'
            )}
          </button>

          <button
            onClick={finishIntro}
            className="mt-2 text-xs text-gray-400 underline w-full text-center"
          >
            Lewati
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Login Form ---------- */
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-md w-full space-y-6 bg-gray-900/70 backdrop-blur-md p-8 rounded-2xl border border-gray-800 shadow-xl">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-white">DigiHeritage</h2>
          <p className="mt-1 text-sm text-gray-400">Sign in to continue</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email address"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-400">
              <input type="checkbox" className="h-4 w-4 mr-2 rounded bg-gray-800 border-gray-600 focus:ring-blue-500" />
              Remember me
            </label>
            <a href="#" className="text-blue-400 hover:text-blue-300">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Don’t have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
// src/pages/auth/Login.tsx
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
  onLogin: (user: any) => void; // Updated to pass user data
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
  const [loading, setLoading] = useState(false);

  // Helper function to save user data to localStorage
  const saveUserData = (user: any) => {
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL,
      provider: user.providerData?.[0]?.providerId || 'email',
      role: 'Admin', // Default role, can be customized
      loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('cureva-user', JSON.stringify(userData));
    return userData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../../lib/firebase');

      console.log('Attempting email login...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user);

      const userData = saveUserData(userCredential.user);
      onLogin(userData);
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.code === 'auth/invalid-credential'
        ? 'Email atau password salah'
        : error?.code === 'auth/user-not-found'
        ? 'User tidak ditemukan'
        : error?.code === 'auth/wrong-password'
        ? 'Password salah'
        : 'Login gagal. Silakan coba lagi.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const { auth } = await import('../../lib/firebase');

      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const userData = saveUserData(userCredential.user);
      onLogin(userData);
    } catch (error: any) {
      // Don't show error if user closed the popup
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        console.error('Google sign in error:', error);
        alert('Google sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // GitHub Sign In
  const handleGitHubSignIn = async () => {
    setLoading(true);
    try {
      const { signInWithPopup, GithubAuthProvider } = await import('firebase/auth');
      const { auth } = await import('../../lib/firebase');

      const provider = new GithubAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const userData = saveUserData(userCredential.user);
      onLogin(userData);
    } catch (error: any) {
      // Don't show error if user closed the popup
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        console.error('GitHub sign in error:', error);
        alert('GitHub sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Render ---------- */
  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950 text-white p-4">
        {/* Logo */}
        <div className="pt-8 flex flex-col items-center">
          <img
            src="/src/assets/cureva_logo.jpg"
            alt="Cureva Logo"
            className="h-24 w-24 rounded-full object-cover border-4 border-white/20 shadow-2xl mb-4"
          />
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
            onClick={() =>
              step < slides.length - 1 ? setStep(step + 1) : finishIntro()
            }
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950">
      <div className="max-w-md w-full space-y-6 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-purple-500/20 p-8">
        {/* Logo */}
        <div className="text-center">
          <img
            src="/src/assets/cureva_logo.jpg"
            alt="Cureva Logo"
            className="mx-auto h-20 w-20 rounded-full object-cover border-2 border-white/20"
          />
          <h2 className="mt-4 text-5xl font-extrabold text-white">Cureva</h2>
          <p className="mt-1 text-sm text-gray-300">Masuk untuk melanjutkan</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label htmlFor="email" className="sr-only">
              Alamat email
            </label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Alamat email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="sr-only">
              Kata sandi
            </label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-10 py-3 border border-white/20 rounded-lg bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Kata sandi"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-50"
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-300">
              <input type="checkbox" className="h-4 w-4 mr-2 rounded bg-white/5 border-white/30" />
              Ingat saya
            </label>
            <a href="#" className="text-blue-400 hover:text-blue-300">
              Lupa kata sandi?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sedang masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-300">
          Belum punya akun?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300">
            Daftar
          </Link>
        </p>

        {/* ---------- Social Login ---------- */}
        <div className="space-y-3 mt-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center py-2.5 px-4 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}
          </button>

          <button
            onClick={handleGitHubSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center py-2.5 px-4 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            {loading ? 'Menghubungkan...' : 'Lanjutkan dengan GitHub'}
          </button>
        </div>

        {/* Tombol kembali ke Intro */}
        {localStorage.getItem('cureva-intro-seen') === 'true' && (
          <div className="text-center">
            <button
              onClick={() => {
                localStorage.removeItem('cureva-intro-seen');
                window.location.reload();
              }}
              disabled={loading}
              className="text-xs text-gray-400 underline mt-2 disabled:opacity-50"
            >
              Tonton pengenalan lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
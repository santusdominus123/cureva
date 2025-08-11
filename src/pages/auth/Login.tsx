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
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = saveUserData(userCredential.user);
      onLogin(userData);
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials.');
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
    } catch (error) {
      console.error('Google sign in error:', error);
      alert('Google sign in failed. Please try again.');
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
    } catch (error) {
      console.error('GitHub sign in error:', error);
      alert('GitHub sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Render ---------- */
  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950 text-white p-4">
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
          <p className="mt-1 text-sm text-gray-300">Sign in to continue</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
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
                placeholder="Email address"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="sr-only">
              Password
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
                placeholder="Password"
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
              Remember me
            </label>
            <a href="#" className="text-blue-400 hover:text-blue-300">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-300">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300">
            Register
          </Link>
        </p>

        {/* ---------- Social Login ---------- */}
        <div className="space-y-3 mt-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center py-2.5 px-4 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="https://authjs.dev/img/providers/google.svg" alt="G" className="h-5 w-5 mr-2" />
            {loading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <button
            onClick={handleGitHubSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center py-2.5 px-4 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="https://authjs.dev/img/providers/github-dark.svg" alt="GH" className="h-5 w-5 mr-2" />
            {loading ? 'Connecting...' : 'Continue with GitHub'}
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
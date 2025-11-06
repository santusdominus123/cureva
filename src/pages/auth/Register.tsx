import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MailIcon, LockIcon, UserIcon, EyeIcon, EyeOffIcon, ArrowLeftIcon } from "lucide-react";
import logoImg from "../../assets/cureva_logo.jpg";
import BackgroundImage from "../../components/ui/BackgroundImage";

interface RegisterProps {
  onLogin: (user?: unknown) => void;
}
const Register: React.FC<RegisterProps> = ({ onLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // In a real app, you would register the user here
    // Create a lightweight local user object to mirror Login behavior
    const userData = {
      uid: `local-${Date.now()}`,
      email,
      displayName: name || (email ? email.split("@")[0] : "User"),
      photoURL: null,
      provider: "local",
      role: "Admin",
      loginTime: new Date().toISOString(),
    };
    try {
      localStorage.setItem("cureva-user", JSON.stringify(userData));
    } catch (err) {
      // ignore localStorage errors
    }
    onLogin(userData);
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center p-2 overflow-y-auto overflow-x-hidden">
      {/* Optimized Background Image with Preloading */}
      <BackgroundImage
        src="/src/introbg/1.jpg"
        alt="Cureva Register Background"
        overlayClassName="bg-gradient-to-br from-black/80 via-indigo-950/70 to-black/80"
      />

      {/* Content Container */}
      <div className="relative z-10 max-w-[340px] sm:max-w-md w-full my-auto space-y-2 sm:space-y-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl shadow-purple-500/20 p-3 sm:p-4">
        {/* Back to Onboarding Button */}
        <Link to="/onboarding" className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1 text-gray-300 hover:text-white transition-colors duration-200">
          <ArrowLeftIcon size={16} className="sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm">Kembali</span>
        </Link>

        {/* Logo */}
        <div className="text-center pt-4 sm:pt-2">
          <img src={logoImg} alt="Cureva Logo" className="mx-auto h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full object-cover border-2 border-white/20" />
          <h2 className="mt-1.5 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-extrabold text-white">Cureva</h2>
          <p className="mt-0.5 text-xs sm:text-sm text-gray-300">Daftar untuk melanjutkan</p>
        </div>
        <form className="space-y-2 sm:space-y-2.5" onSubmit={handleSubmit}>
          <div className="space-y-2 sm:space-y-2.5">
            <div>
              <label htmlFor="name" className="sr-only">
                Nama lengkap
              </label>
              <div className="relative">
                <UserIcon className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 text-sm sm:text-base border border-white/20 rounded-lg bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Nama lengkap"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Alamat email
              </label>
              <div className="relative">
                <MailIcon className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 text-sm sm:text-base border border-white/20 rounded-lg bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Alamat email"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Kata sandi
              </label>
              <div className="relative">
                <LockIcon className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 text-sm sm:text-base border border-white/20 rounded-lg bg-white/5 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Kata sandi"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={loading} className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-50">
                  {showPassword ? <EyeOffIcon size={16} className="sm:w-5 sm:h-5" /> : <EyeIcon size={16} className="sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 sm:py-2.5 px-4 text-sm rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Mendaftar..." : "Daftar"}
          </button>
        </form>

        <p className="text-center text-xs sm:text-sm text-gray-300">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Masuk
          </Link>
        </p>

        {/* ---------- Social Login ---------- */}
        <div className="space-y-1.5 sm:space-y-2">
          <button
            disabled={loading}
            className="w-full flex items-center justify-center py-1.5 sm:py-2 px-3 text-xs sm:text-sm border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? "Menghubungkan..." : "Lanjutkan dengan Google"}
          </button>

          <button
            disabled={loading}
            className="w-full flex items-center justify-center py-1.5 sm:py-2 px-3 text-xs sm:text-sm border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
              />
            </svg>
            {loading ? "Menghubungkan..." : "Lanjutkan dengan GitHub"}
          </button>
        </div>

        {/* Partnership Logos */}
        <div className="pt-2 border-t border-white/10">
          <p className="text-center text-[9px] sm:text-[10px] text-gray-200 mb-1">Didukung oleh:</p>
          <div className="flex justify-center items-center gap-1 sm:gap-1.5 flex-wrap">
            <img
              src="/src/introbg/udayana logo.png"
              alt="Universitas Udayana"
              className="h-4 sm:h-5 md:h-6 w-auto object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <img
              src="/src/introbg/Logo Kemdiktisaintek RI Warna.png"
              alt="Kemdiktisaintek RI"
              className="h-4 sm:h-5 md:h-6 w-auto object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <img
              src="/src/introbg/Logo Diktisaintek Berdampak_Horizontal Logo.png"
              alt="Dikti Saintek Berdampak"
              className="h-4 sm:h-5 md:h-6 w-auto object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <img
              src="/src/introbg/Logo Belmawa Bersinergi - Warna.png"
              alt="Belmawa Bersinergi"
              className="h-5 sm:h-6 md:h-7 w-auto object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <img
              src="/src/introbg/Logo PKM - Warna.png"
              alt="PKM"
              className="h-4 sm:h-5 md:h-6 w-auto object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Register;

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MailIcon, LockIcon, UserIcon, EyeIcon, EyeOffIcon } from "lucide-react";
interface RegisterProps {
  onLogin: (user?: unknown) => void;
}
const Register: React.FC<RegisterProps> = ({ onLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
  };
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Image - Same as Onboarding & Login */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/src/introbg/1.jpg')`,
        }}
      >
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-purple-950/70 to-black/80" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-md w-full space-y-8 bg-white/5 backdrop-blur-2xl p-8 rounded-2xl border border-white/10 shadow-xl">
        <div className="text-center">
          <img
            src="/src/assets/cureva_logo.jpg"
            alt="Cureva Logo"
            className="mx-auto h-20 w-20 rounded-full object-cover border-2 border-white/20"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-white">Buat Akun</h2>
          <p className="mt-2 text-sm text-gray-400">Bergabung dengan Cureva untuk mulai mendigitalisasi warisan budaya</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Nama lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-800/50 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nama lengkap"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Alamat email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MailIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-800/50 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Alamat email"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Kata sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-700 rounded-lg bg-gray-800/50 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kata sandi"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-gray-400 focus:outline-none">
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Buat akun
            </button>
          </div>
          <div className="flex flex-col space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-500">Atau lanjutkan dengan</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="py-2.5 px-4 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                <div className="flex items-center justify-center">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                    <path
                      fill="#FFC107"
                      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                    />
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                  </svg>
                  <span className="text-sm font-medium text-white ml-2">Google</span>
                </div>
              </button>
              <button type="button" className="py-2.5 px-4 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                <div className="flex items-center justify-center">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-white ml-2">GitHub</span>
                </div>
              </button>
            </div>
          </div>
        </form>
        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Masuk
            </Link>
          </p>
        </div>

        {/* Partnership Logos */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-center text-xs text-gray-400 mb-4">Didukung oleh:</p>
          <div className="flex justify-center items-center gap-6 flex-wrap">
            <img
              src="/src/introbg/udayana logo.png"
              alt="Universitas Udayana"
              className="h-14 w-auto object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <img
              src="/src/introbg/Logo Diktisaintek Berdampak_Horizontal Logo.png"
              alt="Dikti Saintek Berdampak"
              className="h-10 w-auto object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Register;

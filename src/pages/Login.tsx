import React, { useState, useEffect } from 'react';
import { 
  signInWithGoogle, 
  loginWithEmail, 
  registerWithEmail 
} from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { GraduationCap, Sparkles, CheckCircle2, ShieldCheck, Zap, ArrowRight, Mail, Lock, UserPlus, LogIn, User, School } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole, School as SchoolType } from '../types';

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [role, setRole] = useState<UserRole>('GURU');
  const [schools, setSchools] = useState<SchoolType[]>([]);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const q = query(collection(db, 'schools'), orderBy('name'));
        const snap = await getDocs(q);
        setSchools(snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolType)));
      } catch (err) {
        console.error("Error fetching schools:", err);
      }
    };
    fetchSchools();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Silakan isi email dan password.');
      return;
    }

    if (isRegistering && (!displayName || !schoolId)) {
      setError('Silakan isi nama lengkap dan pilih sekolah.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isRegistering) {
        // We pass extra data to register function
        // But wait, the registerWithEmail in firebase.ts only takes email/pass
        // I should probably update it or handle it here.
        // Let's update registerWithEmail to accept extra data.
        await registerWithEmail(email, password, {
          displayName,
          schoolId,
          role,
          status: 'PENDING'
        });
        alert('Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Super Admin.');
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
    console.error("Auth Error:", err);
    if (err.code === 'auth/popup-blocked') {
      setError('Popup diblokir oleh browser. Silakan izinkan popup.');
    } else if (err.code === 'auth/wrong-password') {
      setError('Password salah. Silakan coba lagi.');
    } else if (err.code === 'auth/user-not-found') {
      setError('Email tidak ditemukan. Jika Anda baru pertama kali masuk, silakan klik "Daftar gratis" di bawah untuk membuat password, atau gunakan tombol Google.');
    } else if (err.code === 'auth/email-already-in-use') {
      setError('Email sudah digunakan oleh akun lain.');
    } else if (err.code === 'auth/weak-password') {
      setError('Password terlalu lemah (minimal 6 karakter).');
    } else if (err.code === 'auth/invalid-email') {
      setError('Format email tidak valid.');
    } else {
      setError(`Gagal: ${err.message || 'Terjadi kesalahan'}`);
    }
  };

  const features = [
    { icon: Zap, text: "Otomatisasi RPP & Modul Ajar" },
    { icon: ShieldCheck, text: "Keamanan Data Terjamin" },
    { icon: CheckCircle2, text: "Sesuai Kurikulum Merdeka" }
  ];

  return (
    <div className="flex min-h-screen bg-white overflow-hidden">
      {/* Left Side: Brand & Atmosphere */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03]" 
               style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="h-12 w-12 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <GraduationCap size={28} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">EDUADMIN AI</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Revolusi Administrasi <br />
              <span className="text-purple-400">Guru Masa Depan.</span>
            </h1>
            <p className="text-lg text-slate-400 mb-10 leading-relaxed">
              Hemat waktu berjam-jam setiap minggu. Biarkan AI kami membantu Anda menyusun dokumen pendidikan yang berkualitas dan terstruktur.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-slate-300">
                <div className="h-6 w-6 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <feature.icon size={14} />
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 lg:bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md py-12"
        >
          <div className="lg:hidden mb-12 flex items-center gap-3 justify-center">
            <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center text-white">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">EDUADMIN AI</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isRegistering ? 'Buat Akun Baru' : 'Selamat Datang'}
            </h2>
            <p className="text-slate-500">
              {isRegistering 
                ? 'Daftar untuk mulai mengotomatisasi administrasi Anda.' 
                : 'Masuk untuk mengelola administrasi sekolah Anda dengan cerdas.'}
            </p>
          </div>

          <div className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100"
              >
                <div className="flex gap-3">
                  <ShieldCheck size={18} className="shrink-0" />
                  <p>{error}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isRegistering && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 ml-1">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <Input 
                        placeholder="Masukkan nama lengkap Anda" 
                        className="pl-10 h-12"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 ml-1">Sekolah</label>
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <Select 
                        className="pl-10 h-12"
                        value={schoolId}
                        onChange={(e) => setSchoolId(e.target.value)}
                        options={[
                          { value: '', label: '-- Pilih Sekolah --' },
                          ...schools.map(s => ({ value: s.id, label: s.name }))
                        ]}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 ml-1">Peran</label>
                    <Select 
                      className="h-12"
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      options={[
                        { value: 'GURU', label: 'Guru' },
                        { value: 'ADMIN_SEKOLAH', label: 'Admin Sekolah' }
                      ]}
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    type="email" 
                    placeholder="nama@sekolah.id" 
                    className="pl-10 h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {!isRegistering && (
                <div className="flex justify-end">
                  <button type="button" className="text-xs text-purple-600 hover:underline font-medium">
                    Lupa Password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base gap-2 bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100"
                isLoading={loading}
              >
                {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
                {isRegistering ? 'Daftar Sekarang' : 'Masuk'}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 tracking-widest">Atau</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-12 text-base gap-3 border-slate-200 hover:bg-slate-50"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google" 
                className="w-5 h-5"
                referrerPolicy="no-referrer"
              />
              Lanjutkan dengan Google
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-slate-500">
                {isRegistering ? 'Sudah punya akun?' : 'Belum punya akun?'}
                <button 
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="ml-2 text-purple-600 font-bold hover:underline"
                >
                  {isRegistering ? 'Masuk di sini' : 'Daftar gratis'}
                </button>
              </p>
            </div>

            <div className="pt-8 text-center border-t border-slate-50">
              <p className="text-xs text-slate-400 mb-2">Bermasalah saat masuk?</p>
              <a 
                href={window.location.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-purple-600 font-semibold hover:text-purple-700 transition-colors"
              >
                Buka di Tab Baru
                <ArrowRight size={14} />
              </a>
              <p className="mt-2 text-[10px] text-slate-400">
                Beberapa browser memblokir login di dalam frame. Membuka di tab baru biasanya menyelesaikan masalah ini.
              </p>
            </div>
          </div>

          <footer className="mt-12 text-center">
            <p className="text-xs text-slate-400">
              © 2026 EDUADMIN AI. Seluruh hak cipta dilindungi.
            </p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
};

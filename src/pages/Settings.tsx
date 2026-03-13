import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Shield, User, Mail, AlertTriangle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const Settings = () => {
  const { user, profile } = useAuth();

  const handleForceAdmin = async () => {
    if (!user || !user.email) return;
    if (user.email.toLowerCase().trim() !== 'mindpathtrainingcenter@gmail.com') {
      alert('Hanya akun pusat yang dapat menggunakan fitur ini.');
      return;
    }

    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { role: 'SUPER_ADMIN' });
      alert('Peran berhasil diperbarui ke SUPER_ADMIN. Silakan refresh halaman.');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui peran. Pastikan Anda login dengan akun yang benar.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Profil</h1>
        <p className="text-slate-500">Kelola informasi akun dan preferensi Anda.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-2xl font-bold">
            {profile?.displayName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{profile?.displayName}</h2>
            <div className="flex items-center gap-2 text-slate-500 mt-1">
              <Mail size={16} />
              <span>{profile?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-purple-600 mt-1 font-medium">
              <Shield size={16} />
              <span>Peran: {profile?.role}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">User ID</p>
              <p className="text-sm font-mono text-slate-600">{user?.uid}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Terverifikasi</p>
              <p className="text-sm font-medium text-slate-600">{user?.emailVerified ? 'Ya' : 'Tidak'}</p>
            </div>
          </div>
        </div>
      </Card>

      {user?.email?.toLowerCase().trim() === 'mindpathtrainingcenter@gmail.com' && profile?.role !== 'SUPER_ADMIN' && (
        <Card className="p-6 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900">Deteksi Akun Super Admin</h3>
              <p className="text-sm text-amber-800 mt-1">
                Sistem mendeteksi bahwa Anda login dengan email pusat, namun peran Anda saat ini masih sebagai <strong>{profile?.role}</strong>. 
                Klik tombol di bawah untuk memaksa pembaruan peran ke Super Admin.
              </p>
              <Button 
                onClick={handleForceAdmin}
                className="mt-4 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Paksa Peran Super Admin
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  School as SchoolIcon, 
  Plus, 
  Search, 
  Trash2, 
  MapPin, 
  Phone, 
  Globe,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { School } from '../types';
import { ErrorBoundary } from '../components/ErrorBoundary';

const SchoolsContent = () => {
  const { profile } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: '',
    address: '',
    phone: '',
    website: ''
  });

  useEffect(() => {
    if (!profile || profile.role !== 'SUPER_ADMIN') {
        setLoading(false);
        return;
    }

    const q = query(collection(db, 'schools'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schoolsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as School[];
      setSchools(schoolsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching schools:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [profile]);

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name) return;

    try {
      await addDoc(collection(db, 'schools'), {
        ...newSchool,
        createdAt: serverTimestamp()
      });

      setShowAddModal(false);
      setNewSchool({ name: '', address: '', phone: '', website: '' });
      alert('Sekolah berhasil ditambahkan.');
    } catch (error) {
      console.error("Error adding school:", error);
      alert('Gagal menambahkan sekolah.');
    }
  };

  const handleDeleteSchool = async (schoolId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus sekolah ini? Semua data terkait mungkin akan terpengaruh.')) return;
    try {
      await deleteDoc(doc(db, 'schools', schoolId));
    } catch (err) {
      console.error("Error deleting school:", err);
      alert('Gagal menghapus sekolah.');
    }
  };

  const filteredSchools = schools.filter(school => 
    school.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (profile?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-800">Akses Terbatas</h2>
        <p className="text-slate-500">Hanya Super Admin yang dapat mengelola data sekolah.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Sekolah</h1>
          <p className="text-slate-500">Kelola daftar sekolah yang terdaftar di sistem.</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 hover:bg-purple-700 gap-2"
        >
          <Plus size={18} />
          Tambah Sekolah
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Cari nama atau alamat sekolah..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {loading ? (
            <div className="col-span-full py-12 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              Tidak ada data sekolah ditemukan.
            </div>
          ) : (
            filteredSchools.map((school) => (
              <motion.div
                key={school.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl hover:border-purple-100 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                    <SchoolIcon size={24} />
                  </div>
                  <button 
                    onClick={() => handleDeleteSchool(school.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{school.name}</h3>
                
                <div className="space-y-2 text-sm text-slate-500">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    <span>{school.address || 'Alamat belum diatur'}</span>
                  </div>
                  {school.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="shrink-0" />
                      <span>{school.phone}</span>
                    </div>
                  )}
                  {school.website && (
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="shrink-0" />
                      <a href={school.website.startsWith('http') ? school.website : `https://${school.website}`} 
                         target="_blank" rel="noopener noreferrer"
                         className="text-purple-600 hover:underline">
                        {school.website}
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>

      {/* Add School Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Tambah Sekolah Baru</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleAddSchool} className="p-6 space-y-4">
                <Input 
                  label="Nama Sekolah" 
                  placeholder="Masukkan nama sekolah"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({...newSchool, name: e.target.value})}
                  required
                />
                <Input 
                  label="Alamat" 
                  placeholder="Masukkan alamat lengkap"
                  value={newSchool.address}
                  onChange={(e) => setNewSchool({...newSchool, address: e.target.value})}
                />
                <Input 
                  label="Nomor Telepon" 
                  placeholder="Contoh: 021-1234567"
                  value={newSchool.phone}
                  onChange={(e) => setNewSchool({...newSchool, phone: e.target.value})}
                />
                <Input 
                  label="Website" 
                  placeholder="www.sekolah.sch.id"
                  value={newSchool.website}
                  onChange={(e) => setNewSchool({...newSchool, website: e.target.value})}
                />

                <div className="pt-4 flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowAddModal(false)}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Simpan Sekolah
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Schools = () => (
  <ErrorBoundary>
    <SchoolsContent />
  </ErrorBoundary>
);

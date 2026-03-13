import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { 
  UserPlus, 
  Search, 
  MoreVertical, 
  Mail, 
  Shield, 
  School as SchoolIcon,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  BarChart3,
  Clock,
  FileText,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, UserRole, School } from '../types';
import { ErrorBoundary } from '../components/ErrorBoundary';

const UsersContent = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMonitorModal, setShowMonitorModal] = useState<UserProfile | null>(null);
  const [teacherStats, setTeacherStats] = useState<{docCount: number, lastDocs: any[]}>({docCount: 0, lastDocs: []});
  
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');
  const [showEditModal, setShowEditModal] = useState<UserProfile | null>(null);
  
  const [newTeacher, setNewTeacher] = useState({
    email: '',
    displayName: '',
    role: 'GURU' as UserRole,
    schoolId: ''
  });

  const [editUser, setEditUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!profile) return;

    // Fetch Schools if Super Admin
    if (profile.role === 'SUPER_ADMIN') {
      const unsubSchools = onSnapshot(collection(db, 'schools'), (snap) => {
        setSchools(snap.docs.map(d => ({ id: d.id, ...d.data() } as School)));
      });
      return () => unsubSchools();
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;

    let q;
    if (profile.role === 'SUPER_ADMIN') {
      q = query(collection(db, 'users'));
    } else {
      q = query(collection(db, 'users'), where('schoolId', '==', profile.schoolId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as UserProfile[];
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [profile]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!showMonitorModal) return;
      
      try {
        const q = query(
          collection(db, 'documents'), 
          where('authorId', '==', showMonitorModal.uid)
        );
        const snap = await getDocs(q);
        let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Sort in memory
        docs = docs.sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

        setTeacherStats({
          docCount: snap.size,
          lastDocs: docs.slice(0, 5)
        });
      } catch (err) {
        console.error("Error fetching teacher stats:", err);
        setTeacherStats({docCount: 0, lastDocs: []});
      }
    };

    fetchStats();
  }, [showMonitorModal]);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newTeacher.email || !newTeacher.displayName) return;

    const targetSchoolId = profile.role === 'SUPER_ADMIN' ? newTeacher.schoolId : profile.schoolId;
    
    if (!targetSchoolId) {
      alert('Silakan pilih sekolah.');
      return;
    }

    try {
      const userQuery = query(collection(db, 'users'), where('email', '==', newTeacher.email));
      const existingUsers = await getDocs(userQuery);
      
      if (!existingUsers.empty) {
        alert('User dengan email ini sudah terdaftar.');
        return;
      }

      await addDoc(collection(db, 'users'), {
        email: newTeacher.email,
        displayName: newTeacher.displayName,
        role: newTeacher.role,
        schoolId: targetSchoolId,
        createdAt: serverTimestamp(),
        isPreAuthorized: true,
        status: 'APPROVED'
      });

      setShowAddModal(false);
      setNewTeacher({ email: '', displayName: '', role: 'GURU', schoolId: '' });
      alert('User berhasil ditambahkan.');
    } catch (error) {
      console.error("Error adding teacher:", error);
      alert('Gagal menambahkan user.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus user ini?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      console.error("Error deleting user:", err);
      alert('Gagal menghapus user.');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      await updateDoc(doc(db, 'users', editUser.uid), {
        displayName: editUser.displayName,
        role: editUser.role,
        schoolId: editUser.schoolId
      });
      setEditUser(null);
      alert('User berhasil diperbarui.');
    } catch (error) {
      console.error("Error updating user:", error);
      alert('Gagal memperbarui user.');
    }
  };

  const handleApproveRequest = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'APPROVED'
      });
      alert('Akun berhasil disetujui.');
    } catch (err) {
      console.error("Error approving user:", err);
      alert('Gagal menyetujui akun.');
    }
  };

  const handleRejectRequest = async (userId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menolak pendaftaran ini?')) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'REJECTED'
      });
      alert('Pendaftaran ditolak.');
    } catch (err) {
      console.error("Error rejecting user:", err);
      alert('Gagal menolak pendaftaran.');
    }
  };

  const filteredUsers = users.filter(user => 
    (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    user.email?.toLowerCase().trim() !== 'mindpathtrainingcenter@gmail.com' &&
    (activeTab === 'users' ? (user.status === 'APPROVED' || !user.status) : user.status === 'PENDING')
  );

  const formatLastActive = (timestamp: any) => {
    if (!timestamp) return 'Belum pernah aktif';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('id-ID', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Pengguna</h1>
          <p className="text-slate-500">Kelola akses, peran, dan pantau kinerja guru.</p>
        </div>
        <div className="flex gap-2">
          {profile?.role === 'SUPER_ADMIN' && (
            <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
              <button 
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Daftar Pengguna
              </button>
              <button 
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${activeTab === 'requests' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Permintaan Akun
                {users.filter(u => u.status === 'PENDING').length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                    {users.filter(u => u.status === 'PENDING').length}
                  </span>
                )}
              </button>
            </div>
          )}
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-700 gap-2"
          >
            <UserPlus size={18} />
            Tambah Pengguna
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Cari nama atau email..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Nama & Email</th>
                <th className="px-6 py-4 font-semibold">Sekolah</th>
                <th className="px-6 py-4 font-semibold">Peran</th>
                <th className="px-6 py-4 font-semibold">Terakhir Aktif</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Tidak ada data pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold overflow-hidden">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            user.displayName?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user.displayName}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail size={12} />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <SchoolIcon size={14} className="text-slate-400" />
                        {schools.find(s => s.id === user.schoolId)?.name || 'Sekolah Tidak Diketahui'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-700' :
                        user.role === 'ADMIN_SEKOLAH' ? 'bg-blue-50 text-blue-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        <Shield size={12} />
                        {user.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock size={14} />
                        {formatLastActive(user.lastActive)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {activeTab === 'requests' ? (
                          <>
                            <button 
                              onClick={() => handleApproveRequest(user.uid)}
                              className="p-2 text-emerald-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                              title="Setujui"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button 
                              onClick={() => setEditUser(user)}
                              className="p-2 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Edit Permintaan"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleRejectRequest(user.uid)}
                              className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Tolak"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => setShowMonitorModal(user)}
                              className="p-2 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Monitor Kinerja"
                            >
                              <BarChart3 size={18} />
                            </button>
                            <button 
                              onClick={() => setEditUser(user)}
                              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Edit User"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.uid)}
                              className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Hapus User"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Edit Pengguna</h2>
                <button 
                  onClick={() => setEditUser(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                <Input 
                  label="Nama Lengkap" 
                  value={editUser.displayName}
                  onChange={(e) => setEditUser({...editUser, displayName: e.target.value})}
                  required
                />
                
                <Select 
                  label="Pilih Sekolah"
                  value={editUser.schoolId}
                  onChange={(e) => setEditUser({...editUser, schoolId: e.target.value})}
                  options={[
                    { value: '', label: '-- Pilih Sekolah --' },
                    ...schools.map(s => ({ value: s.id, label: s.name }))
                  ]}
                  required
                />

                <Select 
                  label="Peran Akses"
                  value={editUser.role}
                  onChange={(e) => setEditUser({...editUser, role: e.target.value as UserRole})}
                  options={[
                    { value: 'GURU', label: 'Guru' },
                    { value: 'ADMIN_SEKOLAH', label: 'Admin Sekolah' },
                    { value: 'SUPER_ADMIN', label: 'Super Admin' }
                  ]}
                />

                <div className="pt-4 flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setEditUser(null)}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
                <h2 className="text-xl font-bold text-slate-900">Tambah Pengguna Baru</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTeacher} className="p-6 space-y-4">
                <Input 
                  label="Nama Lengkap" 
                  placeholder="Masukkan nama lengkap"
                  value={newTeacher.displayName}
                  onChange={(e) => setNewTeacher({...newTeacher, displayName: e.target.value})}
                  required
                />
                <Input 
                  label="Alamat Email" 
                  type="email"
                  placeholder="email@sekolah.id"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                  required
                />
                
                {profile?.role === 'SUPER_ADMIN' && (
                  <Select 
                    label="Pilih Sekolah"
                    value={newTeacher.schoolId}
                    onChange={(e) => setNewTeacher({...newTeacher, schoolId: e.target.value})}
                    options={[
                      { value: '', label: '-- Pilih Sekolah --' },
                      ...schools.map(s => ({ value: s.id, label: s.name }))
                    ]}
                    required
                  />
                )}

                <Select 
                  label="Peran Akses"
                  value={newTeacher.role}
                  onChange={(e) => setNewTeacher({...newTeacher, role: e.target.value as UserRole})}
                  options={[
                    { value: 'GURU', label: 'Guru (Pengguna Biasa)' },
                    { value: 'ADMIN_SEKOLAH', label: 'Admin Sekolah (Manajer)' },
                    { value: 'SUPER_ADMIN', label: 'Super Admin (Pusat)' }
                  ]}
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
                    Simpan User
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Monitoring Modal */}
      <AnimatePresence>
        {showMonitorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold overflow-hidden">
                    {showMonitorModal.photoURL ? (
                      <img src={showMonitorModal.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      showMonitorModal.displayName?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{showMonitorModal.displayName}</h2>
                    <p className="text-sm text-slate-500">{showMonitorModal.email} • {showMonitorModal.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMonitorModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <Card className="p-4 bg-purple-50 border-purple-100">
                    <div className="flex items-center gap-3 text-purple-600 mb-2">
                      <FileText size={20} />
                      <span className="text-sm font-semibold uppercase tracking-wider">Dokumen</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{teacherStats.docCount}</p>
                    <p className="text-xs text-slate-500 mt-1">Total dokumen dibuat</p>
                  </Card>
                  
                  <Card className="p-4 bg-blue-50 border-blue-100">
                    <div className="flex items-center gap-3 text-blue-600 mb-2">
                      <Activity size={20} />
                      <span className="text-sm font-semibold uppercase tracking-wider">Keaktifan</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 truncate">
                      {showMonitorModal.lastActive ? 'Aktif' : 'Belum Aktif'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Status saat ini</p>
                  </Card>

                  <Card className="p-4 bg-emerald-50 border-emerald-100">
                    <div className="flex items-center gap-3 text-emerald-600 mb-2">
                      <Clock size={20} />
                      <span className="text-sm font-semibold uppercase tracking-wider">Terakhir</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {showMonitorModal.lastActive ? formatLastActive(showMonitorModal.lastActive).split(',')[0] : '-'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Aktivitas terakhir</p>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Activity size={18} className="text-purple-600" />
                    Aktivitas Terbaru
                  </h3>
                  
                  {teacherStats.lastDocs.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl text-slate-400">
                      Belum ada aktivitas dokumen yang tercatat.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teacherStats.lastDocs.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{doc.title}</p>
                              <p className="text-xs text-slate-500">{doc.type} • {doc.subject}</p>
                            </div>
                          </div>
                          <p className="text-[10px] font-medium text-slate-400">
                            {doc.createdAt ? formatLastActive(doc.createdAt) : '-'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <Button onClick={() => setShowMonitorModal(null)}>Tutup</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Users = () => (
  <ErrorBoundary>
    <UsersContent />
  </ErrorBoundary>
);

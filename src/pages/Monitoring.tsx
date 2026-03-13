import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  getDocs,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { 
  BarChart3, 
  Users as UsersIcon, 
  FileText, 
  Activity,
  TrendingUp,
  Clock,
  Search
} from 'lucide-react';
import { Input } from '../components/ui/Input';
import { UserProfile, Document } from '../types';
import { ErrorBoundary } from '../components/ErrorBoundary';

const MonitoringContent = () => {
  const { profile } = useAuth();
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!profile) return;

    // Fetch Teachers
    let teacherQuery;
    if (profile.role === 'SUPER_ADMIN') {
      teacherQuery = query(collection(db, 'users'), where('role', '==', 'GURU'));
    } else {
      teacherQuery = query(
        collection(db, 'users'), 
        where('role', '==', 'GURU'),
        where('schoolId', '==', profile.schoolId)
      );
    }

    const unsubTeachers = onSnapshot(teacherQuery, (snap) => {
      setTeachers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    });

    // Fetch Documents for stats
    let docQuery;
    if (profile.role === 'SUPER_ADMIN') {
      docQuery = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
    } else {
      // Avoid composite index requirement by sorting in memory
      docQuery = query(
        collection(db, 'documents'), 
        where('schoolId', '==', profile.schoolId)
      );
    }

    const unsubDocs = onSnapshot(docQuery, (snap) => {
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Document));
      // Sort in memory if not already sorted by query
      if (profile.role !== 'SUPER_ADMIN') {
        docs = docs.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
      }
      setDocuments(docs);
      setLoading(false);
    });

    return () => {
      unsubTeachers();
      unsubDocs();
    };
  }, [profile]);

  const getTeacherStats = (teacherId: string) => {
    const teacherDocs = documents.filter(d => d.authorId === teacherId);
    return {
      count: teacherDocs.length,
      lastDoc: teacherDocs[0]
    };
  };

  const filteredTeachers = teachers.filter(t => 
    t.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalDocs: documents.length,
    activeTeachers: new Set(documents.map(d => d.authorId)).size,
    avgDocsPerTeacher: teachers.length > 0 ? (documents.length / teachers.length).toFixed(1) : 0
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Monitoring Kinerja Guru</h1>
        <p className="text-slate-500">Pantau produktivitas guru dalam menghasilkan administrasi pembelajaran.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-none">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText size={24} />
            </div>
            <TrendingUp size={24} className="text-white/40" />
          </div>
          <p className="text-white/80 text-sm font-medium uppercase tracking-wider">Total Dokumen AI</p>
          <h3 className="text-4xl font-bold mt-1">{stats.totalDocs}</h3>
        </Card>

        <Card className="p-6 bg-white border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <UsersIcon size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Guru Aktif</p>
          <h3 className="text-4xl font-bold text-slate-900 mt-1">{stats.activeTeachers}</h3>
          <p className="text-xs text-slate-400 mt-2">Dari total {teachers.length} guru terdaftar</p>
        </Card>

        <Card className="p-6 bg-white border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <BarChart3 size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Rata-rata Dokumen</p>
          <h3 className="text-4xl font-bold text-slate-900 mt-1">{stats.avgDocsPerTeacher}</h3>
          <p className="text-xs text-slate-400 mt-2">Dokumen per guru</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Peringkat Produktivitas Guru</h3>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Cari guru..." 
              className="pl-9 h-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Guru</th>
                <th className="px-6 py-4 font-semibold">Total Dokumen</th>
                <th className="px-6 py-4 font-semibold">Aktivitas Terakhir</th>
                <th className="px-6 py-4 font-semibold">Progres</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    Tidak ada data guru ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTeachers
                  .sort((a, b) => getTeacherStats(b.uid).count - getTeacherStats(a.uid).count)
                  .map((teacher) => {
                    const teacherStats = getTeacherStats(teacher.uid);
                    const progress = stats.totalDocs > 0 ? (teacherStats.count / stats.totalDocs) * 100 : 0;
                    
                    return (
                      <tr key={teacher.uid} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden">
                              {teacher.photoURL ? (
                                <img src={teacher.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                teacher.displayName?.charAt(0) || 'U'
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{teacher.displayName}</p>
                              <p className="text-xs text-slate-500">{teacher.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-900">{teacherStats.count}</span>
                            <span className="text-xs text-slate-400">dokumen</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {teacherStats.lastDoc ? (
                            <div className="flex flex-col">
                              <span className="text-sm text-slate-700 font-medium truncate max-w-[200px]">
                                {teacherStats.lastDoc.title}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock size={10} />
                                {new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' }).format(teacherStats.lastDoc.createdAt?.toDate ? teacherStats.lastDoc.createdAt.toDate() : new Date())}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Belum ada aktivitas</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full max-w-[100px] bg-slate-100 rounded-full h-1.5">
                            <div 
                              className="bg-purple-600 h-1.5 rounded-full" 
                              style={{ width: `${Math.min(100, progress * 5)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const Monitoring = () => (
  <ErrorBoundary>
    <MonitoringContent />
  </ErrorBoundary>
);

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { 
  Sparkles, 
  FileText, 
  Download, 
  Copy, 
  CheckCircle2,
  Trash2,
  Wand2,
  Info
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateEducationDocument } from '@/src/services/geminiService';
import { exportToPDF, exportToDocx, exportToExcel } from '@/src/services/exportService';
import { db, auth } from '@/src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { ErrorBoundary } from '../components/ErrorBoundary';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: any[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

const AIGeneratorContent = () => {
  const { type: urlType } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState({
    type: urlType || 'MODUL_AJAR',
    level: 'SD',
    subject: '',
    grade: '',
    topic: '',
    additionalInfo: ''
  });

  useEffect(() => {
    if (urlType) {
      setConfig(prev => ({ ...prev, type: urlType }));
      setResult(null);
    }
  }, [urlType]);

  const generatorTypes = [
    { id: 'PROTA', label: 'Program Tahunan (PROTA)', description: 'Rencana alokasi waktu satu tahun ajaran.' },
    { id: 'PROMES', label: 'Program Semester (PROMES)', description: 'Rincian program kerja per semester.' },
    { id: 'ATP', label: 'Alur Tujuan Pembelajaran (ATP)', description: 'Rangkaian tujuan pembelajaran yang tersusun sistematis.' },
    { id: 'MODUL_AJAR', label: 'Modul Ajar / RPP', description: 'Panduan pelaksanaan pembelajaran di kelas.' },
    { id: 'QUESTION', label: 'Bank Soal', description: 'Kumpulan soal evaluasi berdasarkan materi.' },
  ];

  const currentType = generatorTypes.find(t => t.id === config.type) || generatorTypes[3];

  const handleGenerate = async () => {
    if (!config.subject || !config.grade || !config.topic) {
      alert('Mohon lengkapi semua field!');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const text = await generateEducationDocument(config);
      setResult(text || 'Gagal menghasilkan dokumen.');
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menghubungi AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !auth.currentUser) return;
    
    const path = 'documents';
    try {
      await addDoc(collection(db, path), {
        title: `${config.type} ${config.subject} - ${config.topic}`,
        type: config.type,
        content: result,
        authorId: auth.currentUser.uid,
        schoolId: profile?.schoolId || 'DEFAULT_SCHOOL',
        subject: config.subject,
        grade: config.grade,
        createdAt: serverTimestamp()
      });
      alert('Dokumen berhasil disimpan ke Cloud!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
    if (!result) return;
    const fileName = `${config.type}_${config.subject}_${config.topic}`.replace(/\s+/g, '_');
    
    if (format === 'pdf') {
      exportToPDF(fileName, result);
    } else if (format === 'docx') {
      exportToDocx(fileName, result);
    } else if (format === 'xlsx') {
      exportToExcel(fileName, result);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{currentType.label}</h1>
          <p className="text-slate-500">{currentType.description}</p>
        </div>
        {result && (
          <Button variant="outline" size="sm" onClick={() => setResult(null)} className="text-red-600 border-red-100 hover:bg-red-50 w-fit">
            <Trash2 size={16} className="mr-2" /> Bersihkan
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Sidebar Config */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 space-y-6 lg:sticky lg:top-24"
        >
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6 text-purple-600">
              <Wand2 size={20} />
              <h2 className="font-semibold">Parameter {currentType.id}</h2>
            </div>
            
            <div className="space-y-5">
              {!urlType && (
                <Select 
                  label="Jenis Dokumen" 
                  value={config.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setConfig({ ...config, type: newType });
                    navigate(`/ai-generator/${newType}`);
                  }}
                  options={generatorTypes.map(t => ({ value: t.id, label: t.label }))} 
                />
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <Select 
                  label="Jenjang" 
                  value={config.level}
                  onChange={(e) => setConfig({ ...config, level: e.target.value })}
                  options={[
                    { value: 'SD', label: 'SD' },
                    { value: 'SMP', label: 'SMP' },
                    { value: 'SMA', label: 'SMA' },
                    { value: 'SMK', label: 'SMK' },
                  ]} 
                />
                <Input 
                  label="Kelas" 
                  placeholder="1 / Fase A" 
                  value={config.grade}
                  onChange={(e) => setConfig({ ...config, grade: e.target.value })}
                />
              </div>

              <Input 
                label="Mata Pelajaran" 
                placeholder="Contoh: Bahasa Indonesia" 
                value={config.subject}
                onChange={(e) => setConfig({ ...config, subject: e.target.value })}
              />
              
              <Input 
                label="Topik Utama" 
                placeholder={config.type === 'QUESTION' ? "Contoh: Pecahan Senilai" : "Contoh: Puisi Rakyat"}
                value={config.topic}
                onChange={(e) => setConfig({ ...config, topic: e.target.value })}
              />

              {config.type === 'QUESTION' && (
                <Input 
                  label="Jumlah Soal & Kesulitan" 
                  placeholder="Contoh: 10 soal PG, tingkat sedang" 
                  value={config.additionalInfo}
                  onChange={(e) => setConfig({ ...config, additionalInfo: e.target.value })}
                />
              )}

              {config.type === 'MODUL_AJAR' && (
                <Input 
                  label="Tujuan Pembelajaran Khusus" 
                  placeholder="Contoh: Siswa dapat membedakan rima" 
                  value={config.additionalInfo}
                  onChange={(e) => setConfig({ ...config, additionalInfo: e.target.value })}
                />
              )}

              {(config.type === 'PROTA' || config.type === 'PROMES') && (
                <Input 
                  label="Tahun Ajaran / Semester" 
                  placeholder="Contoh: 2024/2025 - Ganjil" 
                  value={config.additionalInfo}
                  onChange={(e) => setConfig({ ...config, additionalInfo: e.target.value })}
                />
              )}
              
              <Button 
                className="w-full h-11 gap-2 bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100" 
                onClick={handleGenerate} 
                isLoading={loading}
              >
                <Sparkles size={18} />
                Generate {currentType.id}
              </Button>
            </div>
          </Card>

          <Card className="bg-blue-50 border-blue-100 p-4">
            <div className="flex gap-3">
              <Info size={20} className="text-blue-600 shrink-0" />
              <p className="text-sm text-blue-700 leading-relaxed">
                <strong>Tips:</strong> Gunakan topik yang spesifik untuk hasil yang lebih mendalam. AI akan menyesuaikan dengan Capaian Pembelajaran terbaru.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Main Content Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8"
        >
          <Card className="min-h-[600px] flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">
                  {result ? "Preview Dokumen" : "Menunggu Input..."}
                </span>
              </div>
              
              <AnimatePresence>
                {result && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2"
                  >
                    <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 px-3">
                      {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      <span className="ml-2 hidden sm:inline">{copied ? "Tersalin" : "Salin"}</span>
                    </Button>
                    <div className="relative group">
                      <Button variant="outline" size="sm" className="h-8 px-3">
                        <Download size={14} />
                        <span className="ml-2 hidden sm:inline">Export</span>
                      </Button>
                      <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-md shadow-lg z-50 min-w-[120px]">
                        <button 
                          onClick={() => handleExport('pdf')}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-red-500" /> PDF
                        </button>
                        <button 
                          onClick={() => handleExport('docx')}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-blue-500" /> DOCX
                        </button>
                        <button 
                          onClick={() => handleExport('xlsx')}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-emerald-500" /> Excel
                        </button>
                      </div>
                    </div>
                    <Button size="sm" onClick={handleSave} className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 border-none">
                      <CheckCircle2 size={14} />
                      <span className="ml-2 hidden sm:inline">Simpan</span>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Content View */}
            <div className="flex-1 relative">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 space-y-4">
                  <div className="relative">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-600 animate-pulse" size={24} />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-slate-900">AI sedang menyusun dokumen...</p>
                    <p className="text-sm text-slate-500">Ini mungkin memakan waktu 10-20 detik.</p>
                  </div>
                </div>
              ) : null}

              <div className="p-8">
                {result ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-p:text-slate-600"
                  >
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
                    <div className="rounded-full bg-slate-50 p-6">
                      <Sparkles size={48} strokeWidth={1} className="text-slate-300" />
                    </div>
                    <div className="text-center max-w-xs">
                      <p className="font-medium text-slate-600">Siap Membuat Keajaiban?</p>
                      <p className="text-sm">Isi formulir di samping dan klik tombol generate untuk memulai.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export const AIGenerator = () => (
  <ErrorBoundary>
    <AIGeneratorContent />
  </ErrorBoundary>
);

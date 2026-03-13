import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { cn } from '@/src/utils/cn';
import { 
  Users, 
  FileText, 
  CheckSquare, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const data = [
  { name: 'Jan', docs: 40, students: 240 },
  { name: 'Feb', docs: 30, students: 250 },
  { name: 'Mar', docs: 20, students: 260 },
  { name: 'Apr', docs: 27, students: 270 },
  { name: 'May', docs: 18, students: 280 },
  { name: 'Jun', docs: 23, students: 290 },
];

const StatCard = ({ title, value, icon: Icon, trend, trendValue }: any) => (
  <Card className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-500">{title}</span>
      <div className="rounded-md bg-purple-50 p-2 text-purple-600">
        <Icon size={20} />
      </div>
    </div>
    <div className="flex items-end justify-between">
      <span className="text-2xl font-bold">{value}</span>
      <div className={cn(
        "flex items-center text-xs font-medium",
        trend === 'up' ? 'text-emerald-600' : 'text-red-600'
      )}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trendValue}
      </div>
    </div>
  </Card>
);

export const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Siswa" value="1,248" icon={Users} trend="up" trendValue="12%" />
        <StatCard title="Dokumen AI" value="452" icon={FileText} trend="up" trendValue="8%" />
        <StatCard title="Rata-rata Absensi" value="94%" icon={CheckSquare} trend="down" trendValue="2%" />
        <StatCard title="Produktivitas" value="88%" icon={TrendingUp} trend="up" trendValue="15%" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Statistik Dokumen" description="Jumlah dokumen yang dihasilkan setiap bulan">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="docs" fill="#9333ea" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Pertumbuhan Siswa" description="Jumlah siswa terdaftar di platform">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Line type="monotone" dataKey="students" stroke="#9333ea" strokeWidth={2} dot={{ r: 4, fill: '#9333ea' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Aktivitas Terbaru" description="Dokumen yang baru saja dihasilkan oleh AI">
        <div className="space-y-4">
          {[
            { title: 'Modul Ajar Matematika - Fase A', type: 'Modul Ajar', time: '2 jam yang lalu' },
            { title: 'Program Tahunan IPA - Kelas 7', type: 'PROTA', time: '5 jam yang lalu' },
            { title: 'Bank Soal Bahasa Inggris - Semester 1', type: 'Bank Soal', time: 'Kemarin' },
            { title: 'Alur Tujuan Pembelajaran IPS', type: 'ATP', time: '2 hari yang lalu' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
              <div className="flex flex-col">
                <span className="font-medium text-slate-900">{item.title}</span>
                <span className="text-xs text-slate-500">{item.type}</span>
              </div>
              <span className="text-xs text-slate-400">{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

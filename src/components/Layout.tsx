import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  FileText, 
  BookOpen, 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Sparkles,
  GraduationCap,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import { auth as firebaseAuth } from '../firebase';
import { signOut } from 'firebase/auth';
import { UserRole } from '../types';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, active, collapsed }: SidebarItemProps) => (
  <Link
    to={href}
    className={cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-slate-100',
      active ? 'bg-purple-50 text-purple-600 font-medium' : 'text-slate-600',
      collapsed && 'justify-center px-2'
    )}
  >
    <Icon size={20} />
    {!collapsed && <span>{label}</span>}
  </Link>
);

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/', roles: ['SUPER_ADMIN', 'ADMIN_SEKOLAH', 'GURU'] },
    { 
      icon: School, 
      label: 'Manajemen Sekolah', 
      href: '/schools', 
      roles: ['SUPER_ADMIN', 'ADMIN_SEKOLAH'],
      subItems: [
        { label: 'Data Sekolah', href: '/schools' },
      ]
    },
    { 
      icon: Users, 
      label: 'Manajemen Pengguna', 
      href: '/users', 
      roles: ['SUPER_ADMIN', 'ADMIN_SEKOLAH'],
      subItems: [
        { label: 'Daftar Pengguna', href: '/users' },
        { label: 'Monitoring Kinerja Guru', href: '/users/monitoring' },
      ]
    },
    { 
      icon: Sparkles, 
      label: 'AI Generator', 
      href: '/ai-generator',
      roles: ['SUPER_ADMIN', 'ADMIN_SEKOLAH', 'GURU'],
      subItems: [
        { label: 'Program Tahunan', href: '/ai-generator/PROTA' },
        { label: 'Program Semester', href: '/ai-generator/PROMES' },
        { label: 'Alur Tujuan (ATP)', href: '/ai-generator/ATP' },
        { label: 'Modul Ajar / RPP', href: '/ai-generator/MODUL_AJAR' },
        { label: 'Bank Soal', href: '/ai-generator/QUESTION' },
      ]
    },
    { icon: BookOpen, label: 'Jurnal Mengajar', href: '/journals', roles: ['SUPER_ADMIN', 'ADMIN_SEKOLAH', 'GURU'] },
    { icon: CheckSquare, label: 'Absensi', href: '/attendance', roles: ['SUPER_ADMIN', 'ADMIN_SEKOLAH', 'GURU'] },
    { icon: FileText, label: 'Penilaian', href: '/grading', roles: ['SUPER_ADMIN', 'ADMIN_SEKOLAH', 'GURU'] },
    { icon: Calendar, label: 'Kalender', href: '/calendar', roles: ['SUPER_ADMIN', 'ADMIN_SEKOLAH', 'GURU'] },
    { icon: Settings, label: 'Pengaturan', href: '/settings', roles: ['SUPER_ADMIN', 'ADMIN_SEKOLAH', 'GURU'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ADMIN_SEKOLAH': return 'Admin Sekolah';
      case 'GURU': return 'Guru';
      default: return 'User';
    }
  };

  const getCurrentTitle = () => {
    for (const item of menuItems) {
      if (item.href === location.pathname) return item.label;
      if (item.subItems) {
        const subItem = item.subItems.find(sub => sub.href === location.pathname);
        if (subItem) return subItem.label;
      }
    }
    return 'EDUADMIN AI';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-slate-200 bg-white transition-all duration-300',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
          {!collapsed && (
            <div className="flex items-center gap-2 font-bold text-purple-600">
              <GraduationCap size={28} />
              <span className="text-xl tracking-tight">EDUADMIN AI</span>
            </div>
          )}
          {collapsed && <GraduationCap className="mx-auto text-purple-600" size={28} />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex"
          >
            {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <div key={item.href} className="space-y-1">
              <SidebarItem
                {...item}
                active={location.pathname === item.href || (item.subItems && location.pathname.startsWith(item.href))}
                collapsed={collapsed}
              />
              {!collapsed && item.subItems && (location.pathname.startsWith(item.href)) && (
                <div className="ml-9 space-y-1 border-l border-slate-100 pl-2">
                  {item.subItems.map((sub) => (
                    <Link
                      key={sub.href}
                      to={sub.href}
                      className={cn(
                        'block rounded-md px-3 py-1.5 text-sm transition-all hover:bg-slate-50',
                        location.pathname === sub.href ? 'text-purple-600 font-medium' : 'text-slate-500'
                      )}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn('w-full justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-600', collapsed && 'justify-center px-2')}
          >
            <LogOut size={20} />
            {!collapsed && <span>Keluar</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <h2 className="text-lg font-semibold text-slate-800">
            {getCurrentTitle()}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">{profile?.displayName || 'User'}</span>
              <span className="text-xs text-slate-500">{getRoleLabel(profile?.role)}</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
              {profile ? getInitials(profile.displayName) : 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

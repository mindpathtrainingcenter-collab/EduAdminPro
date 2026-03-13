export type UserRole = 'SUPER_ADMIN' | 'ADMIN_SEKOLAH' | 'GURU';

export interface School {
  id: string;
  name: string;
  level: 'PAUD' | 'SD' | 'SMP' | 'SMA' | 'SMK';
  logoUrl?: string;
  address?: string;
  npsn?: string;
  phone?: string;
  website?: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  schoolId?: string;
  photoURL?: string;
  createdAt: any;
  lastActive?: any;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Student {
  id: string;
  schoolId: string;
  name: string;
  nisn: string;
  class: string;
  gender: 'L' | 'P';
}

export interface Document {
  id: string;
  title: string;
  type: 'PROTA' | 'PROMES' | 'ATP' | 'MODUL_AJAR' | 'KOKURIKULER' | 'MEDIA' | 'QUESTION' | 'ANALYSIS';
  content: string;
  authorId: string;
  schoolId: string;
  subject: string;
  grade: string;
  createdAt: any;
}

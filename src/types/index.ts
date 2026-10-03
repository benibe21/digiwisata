// User and Authentication
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PETUGAS';
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export type TourismReportStatus = 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export interface TourismReport {
  id: string;
  report_number: string;
  officer_id: string;
  tourism_site: string;
  tourism_type: string;
  visit_date: string;
  local_visitors: number;
  foreign_visitors: number;
  total_visitors: number;
  district?: string | null;
  location_captured_at?: string | null;
  evidence_path?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  status: TourismReportStatus;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  officer?: Pick<User, 'name' | 'email'>;
}

// Theme
export type Theme = 'light' | 'dark' | 'system';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured =
  typeof supabaseUrl === 'string' &&
  typeof supabaseAnonKey === 'string' &&
  /^https:\/\/[^<>\s]+$/.test(supabaseUrl) &&
  !supabaseUrl.includes('<project-id>') &&
  !supabaseAnonKey.includes('<anon-key>');

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
);

// Database types for TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'ADMIN' | 'PETUGAS';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'ADMIN' | 'PETUGAS';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'ADMIN' | 'PETUGAS';
          created_at?: string;
          updated_at?: string;
        };
      };
      personnel: {
        Row: {
          id: string;
          name: string;
          role: 'JURU_PARKIR' | 'KEAMANAN' | 'KEBERSIHAN' | 'LAINNYA' | 'PENANGGUNG_JAWAB' | 'KOORDINATOR';
          status: 'ACTIVE' | 'INACTIVE';
          is_additional: boolean;
          join_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          role: 'JURU_PARKIR' | 'KEAMANAN' | 'KEBERSIHAN' | 'LAINNYA' | 'PENANGGUNG_JAWAB' | 'KOORDINATOR';
          status?: 'ACTIVE' | 'INACTIVE';
          is_additional?: boolean;
          join_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: 'JURU_PARKIR' | 'KEAMANAN' | 'KEBERSIHAN' | 'LAINNYA' | 'PENANGGUNG_JAWAB' | 'KOORDINATOR';
          status?: 'ACTIVE' | 'INACTIVE';
          is_additional?: boolean;
          join_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      allocation_categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          examples: string[];
          status: 'SIMULASI' | 'BELUM_DISETUJUI' | 'DISETUJUI';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          examples: string[];
          status?: 'SIMULASI' | 'BELUM_DISETUJUI' | 'DISETUJUI';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          examples?: string[];
          status?: 'SIMULASI' | 'BELUM_DISETUJUI' | 'DISETUJUI';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      allocation_configs: {
        Row: {
          id: string;
          category_id: string;
          percentage: number;
          effective_date: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          percentage: number;
          effective_date: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          percentage?: number;
          effective_date?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      closing_reports: {
        Row: {
          id: string;
          date: string;
          time: string;
          omzet: number;
          total_allocation: number;
          remaining_amount: number;
          personnel_count: number;
          per_personnel_amount: number;
          status: 'DRAFT' | 'CONFIRMED' | 'CORRECTED';
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          time: string;
          omzet: number;
          total_allocation: number;
          remaining_amount: number;
          personnel_count: number;
          per_personnel_amount: number;
          status?: 'DRAFT' | 'CONFIRMED' | 'CORRECTED';
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          time?: string;
          omzet?: number;
          total_allocation?: number;
          remaining_amount?: number;
          personnel_count?: number;
          per_personnel_amount?: number;
          status?: 'DRAFT' | 'CONFIRMED' | 'CORRECTED';
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      closing_allocations: {
        Row: {
          id: string;
          closing_report_id: string;
          category_id: string;
          percentage: number;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          closing_report_id: string;
          category_id: string;
          percentage: number;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          closing_report_id?: string;
          category_id?: string;
          percentage?: number;
          amount?: number;
          created_at?: string;
        };
      };
      management_incentives: {
        Row: {
          id: string;
          closing_report_id: string;
          user_id: string;
          amount: number;
          percentage?: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          closing_report_id: string;
          user_id: string;
          amount: number;
          percentage?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          closing_report_id?: string;
          user_id?: string;
          amount?: number;
          percentage?: number;
          created_at?: string;
        };
      };
      fund_transactions: {
        Row: {
          id: string;
          fund_type: 'KAS_OPERASIONAL' | 'DANA_DARURAT' | 'DANA_KEBERSIHAN' | 'DANA_PENGEMBANGAN';
          type: 'IN' | 'OUT';
          amount: number;
          description: string;
          closing_report_id?: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          fund_type: 'KAS_OPERASIONAL' | 'DANA_DARURAT' | 'DANA_KEBERSIHAN' | 'DANA_PENGEMBANGAN';
          type: 'IN' | 'OUT';
          amount: number;
          description: string;
          closing_report_id?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          fund_type?: 'KAS_OPERASIONAL' | 'DANA_DARURAT' | 'DANA_KEBERSIHAN' | 'DANA_PENGEMBANGAN';
          type?: 'IN' | 'OUT';
          amount?: number;
          description?: string;
          closing_report_id?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      social_fund_transactions: {
        Row: {
          id: string;
          type: 'IN' | 'OUT';
          amount: number;
          recipient?: string;
          description: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'IN' | 'OUT';
          amount: number;
          recipient?: string;
          description: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'IN' | 'OUT';
          amount?: number;
          recipient?: string;
          description?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      visitor_protection_transactions: {
        Row: {
          id: string;
          type: 'IN' | 'OUT';
          amount: number;
          case_description?: string;
          status: 'VERIFICATION' | 'APPROVED' | 'REJECTED';
          approved_by?: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'IN' | 'OUT';
          amount: number;
          case_description?: string;
          status?: 'VERIFICATION' | 'APPROVED' | 'REJECTED';
          approved_by?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'IN' | 'OUT';
          amount?: number;
          case_description?: string;
          status?: 'VERIFICATION' | 'APPROVED' | 'REJECTED';
          approved_by?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string;
          old_value?: any;
          new_value?: any;
          reason?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string;
          old_value?: any;
          new_value?: any;
          reason?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          old_value?: any;
          new_value?: any;
          reason?: string;
          created_at?: string;
        };
      };
      closing_corrections: {
        Row: {
          id: string;
          closing_report_id: string;
          old_omzet: number;
          new_omzet: number;
          reason: string;
          corrected_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          closing_report_id: string;
          old_omzet: number;
          new_omzet: number;
          reason: string;
          corrected_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          closing_report_id?: string;
          old_omzet?: number;
          new_omzet?: number;
          reason?: string;
          corrected_by?: string;
          created_at?: string;
        };
      };
    };
  };
};

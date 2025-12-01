import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      weddings: {
        Row: {
          id: string;
          user_id: string;
          bride_name: string;
          groom_name: string;
          wedding_date: string;
          expected_guests: number;
          subscription_status: string;
          subscription_ends_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['weddings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['weddings']['Insert']>;
      };
      budget_items: {
        Row: {
          id: string;
          section_id: string;
          wedding_id: string;
          item_name: string;
          quantity: number;
          unit_cost: number;
          amount: number;
          paid: number;
          balance: number;
          status: string;
          is_guest_dependent: boolean;
          guest_multiplier: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      pledges: {
        Row: {
          id: string;
          wedding_id: string;
          contributor_name: string;
          phone: string | null;
          email: string | null;
          amount_pledged: number;
          amount_paid: number;
          balance: number;
          payment_method: string | null;
          pledge_date: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};

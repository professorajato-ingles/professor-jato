import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          uid: string;
          email: string;
          display_name: string | null;
          photo_url: string | null;
          level: string;
          xp: number;
          current_module: string;
          role: string;
          active: boolean;
          plan: string;
          interactions_today: number;
          last_interaction_date: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      audios: {
        Row: {
          id: string;
          title: string;
          text: string;
          audio_data: string;
          level: string;
          module: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audios']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['audios']['Row']>;
      };
      videos: {
        Row: {
          id: string;
          title: string;
          clip_url: string;
          source_url: string;
          context_text: string;
          created_at: number;
        };
        Insert: Omit<Database['public']['Tables']['videos']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['videos']['Row']>;
      };
      chats: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          content: string;
          session: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chats']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['chats']['Row']>;
      };
      access_logs: {
        Row: {
          id: string;
          user_id: string | null;
          email: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['access_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['access_logs']['Row']>;
      };
      global_stats: {
        Row: {
          id: number;
          total_interactions: number;
          total_users: number;
          total_logins: number;
          total_audio_plays: number;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['global_stats']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['global_stats']['Row']>;
      };
    };
  };
};
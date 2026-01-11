export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blogs: {
        Row: {
          id: string;
          user_id: string;
          platform: 'tistory' | 'blogger' | 'wordpress';
          blog_name: string;
          blog_url: string;
          access_token: string;
          refresh_token: string | null;
          categories: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: 'tistory' | 'blogger' | 'wordpress';
          blog_name: string;
          blog_url: string;
          access_token: string;
          refresh_token?: string | null;
          categories?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: 'tistory' | 'blogger' | 'wordpress';
          blog_name?: string;
          blog_url?: string;
          access_token?: string;
          refresh_token?: string | null;
          categories?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blogs_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          provider: 'openai' | 'claude' | 'gemini' | 'grok';
          encrypted_key: string;
          is_valid: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: 'openai' | 'claude' | 'gemini' | 'grok';
          encrypted_key: string;
          is_valid?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: 'openai' | 'claude' | 'gemini' | 'grok';
          encrypted_key?: string;
          is_valid?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'api_keys_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      keywords: {
        Row: {
          id: string;
          keyword: string;
          category: string;
          source: 'naver' | 'google';
          trend_score: number;
          collected_at: string;
        };
        Insert: {
          id?: string;
          keyword: string;
          category: string;
          source: 'naver' | 'google';
          trend_score?: number;
          collected_at?: string;
        };
        Update: {
          id?: string;
          keyword?: string;
          category?: string;
          source?: 'naver' | 'google';
          trend_score?: number;
          collected_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          blog_id: string;
          keyword_id: string | null;
          title: string;
          content: string;
          status: 'pending' | 'generating' | 'generated' | 'publishing' | 'published' | 'failed';
          published_url: string | null;
          scheduled_at: string | null;
          published_at: string | null;
          retry_count: number;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          blog_id: string;
          keyword_id?: string | null;
          title: string;
          content: string;
          status?: 'pending' | 'generating' | 'generated' | 'publishing' | 'published' | 'failed';
          published_url?: string | null;
          scheduled_at?: string | null;
          published_at?: string | null;
          retry_count?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          blog_id?: string;
          keyword_id?: string | null;
          title?: string;
          content?: string;
          status?: 'pending' | 'generating' | 'generated' | 'publishing' | 'published' | 'failed';
          published_url?: string | null;
          scheduled_at?: string | null;
          published_at?: string | null;
          retry_count?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posts_blog_id_fkey';
            columns: ['blog_id'];
            referencedRelation: 'blogs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posts_keyword_id_fkey';
            columns: ['keyword_id'];
            referencedRelation: 'keywords';
            referencedColumns: ['id'];
          }
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: 'free' | 'light' | 'standard' | 'pro' | 'unlimited';
          status: 'active' | 'cancelled' | 'expired';
          monthly_limit: number;
          usage_count: number;
          current_period_start: string;
          current_period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: 'free' | 'light' | 'standard' | 'pro' | 'unlimited';
          status?: 'active' | 'cancelled' | 'expired';
          monthly_limit?: number;
          usage_count?: number;
          current_period_start?: string;
          current_period_end?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: 'free' | 'light' | 'standard' | 'pro' | 'unlimited';
          status?: 'active' | 'cancelled' | 'expired';
          monthly_limit?: number;
          usage_count?: number;
          current_period_start?: string;
          current_period_end?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

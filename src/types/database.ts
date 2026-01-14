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
          platform: 'blogger' | 'wordpress';
          blog_name: string;
          blog_url: string;
          external_blog_id: string | null;
          username: string | null;
          access_token: string;
          refresh_token: string | null;
          token_expires_at: string | null;
          categories: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: 'blogger' | 'wordpress';
          blog_name: string;
          blog_url: string;
          external_blog_id?: string | null;
          username?: string | null;
          access_token: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
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
          external_blog_id?: string | null;
          username?: string | null;
          access_token?: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
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
          last_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: 'openai' | 'claude' | 'gemini' | 'grok';
          encrypted_key: string;
          is_valid?: boolean;
          last_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: 'openai' | 'claude' | 'gemini' | 'grok';
          encrypted_key?: string;
          is_valid?: boolean;
          last_verified_at?: string | null;
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
          collected_hour: string;
        };
        Insert: {
          id?: string;
          keyword: string;
          category: string;
          source: 'naver' | 'google';
          trend_score?: number;
          collected_at?: string;
          collected_hour?: string;
        };
        Update: {
          id?: string;
          keyword?: string;
          category?: string;
          source?: 'naver' | 'google';
          trend_score?: number;
          collected_at?: string;
          collected_hour?: string;
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
          status: 'draft' | 'pending' | 'scheduled' | 'generating' | 'generated' | 'publishing' | 'published' | 'failed';
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
          status?: 'draft' | 'pending' | 'scheduled' | 'generating' | 'generated' | 'publishing' | 'published' | 'failed';
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
          status?: 'draft' | 'pending' | 'scheduled' | 'generating' | 'generated' | 'publishing' | 'published' | 'failed';
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
      schedules: {
        Row: {
          id: string;
          user_id: string;
          publish_time: string;
          publish_days: string[];
          timezone: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          publish_time?: string;
          publish_days?: string[];
          timezone?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          publish_time?: string;
          publish_days?: string[];
          timezone?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'schedules_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      payment_history: {
        Row: {
          id: string;
          user_id: string;
          payment_key: string;
          order_id: string;
          amount: number;
          plan: 'free' | 'light' | 'standard' | 'pro' | 'unlimited';
          status: 'completed' | 'cancelled' | 'failed';
          method: string | null;
          card_company: string | null;
          card_number: string | null;
          receipt_url: string | null;
          cancelled_at: string | null;
          cancel_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          payment_key: string;
          order_id: string;
          amount: number;
          plan: 'free' | 'light' | 'standard' | 'pro' | 'unlimited';
          status?: 'completed' | 'cancelled' | 'failed';
          method?: string | null;
          card_company?: string | null;
          card_number?: string | null;
          receipt_url?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          payment_key?: string;
          order_id?: string;
          amount?: number;
          plan?: 'free' | 'light' | 'standard' | 'pro' | 'unlimited';
          status?: 'completed' | 'cancelled' | 'failed';
          method?: string | null;
          card_company?: string | null;
          card_number?: string | null;
          receipt_url?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_history_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      notification_settings: {
        Row: {
          id: string;
          user_id: string;
          email_on_publish_success: boolean;
          email_on_publish_fail: boolean;
          email_on_subscription_change: boolean;
          email_on_usage_limit: boolean;
          email_marketing: boolean;
          email_newsletter: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_on_publish_success?: boolean;
          email_on_publish_fail?: boolean;
          email_on_subscription_change?: boolean;
          email_on_usage_limit?: boolean;
          email_marketing?: boolean;
          email_newsletter?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_on_publish_success?: boolean;
          email_on_publish_fail?: boolean;
          email_on_subscription_change?: boolean;
          email_on_usage_limit?: boolean;
          email_marketing?: boolean;
          email_newsletter?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_settings_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      auto_generate_settings: {
        Row: {
          id: string;
          user_id: string;
          is_enabled: boolean;
          preferred_provider: 'openai' | 'claude' | 'gemini' | 'grok';
          preferred_categories: string[];
          posts_per_day: number;
          default_blog_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          is_enabled?: boolean;
          preferred_provider?: 'openai' | 'claude' | 'gemini' | 'grok';
          preferred_categories?: string[];
          posts_per_day?: number;
          default_blog_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          is_enabled?: boolean;
          preferred_provider?: 'openai' | 'claude' | 'gemini' | 'grok';
          preferred_categories?: string[];
          posts_per_day?: number;
          default_blog_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'auto_generate_settings_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'auto_generate_settings_default_blog_id_fkey';
            columns: ['default_blog_id'];
            referencedRelation: 'blogs';
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

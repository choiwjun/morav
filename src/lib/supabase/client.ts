import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// 환경변수는 빌드 타임에 인라인됨
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.');
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

-- API Keys 테이블 생성
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'claude', 'gemini', 'grok')),
  encrypted_key TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE NOT NULL,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_provider_idx ON public.api_keys(provider);
CREATE UNIQUE INDEX IF NOT EXISTS api_keys_user_provider_idx ON public.api_keys(user_id, provider);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 API 키만 조회 가능
CREATE POLICY "Users can view own api_keys"
  ON public.api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 API 키만 생성 가능
CREATE POLICY "Users can insert own api_keys"
  ON public.api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 API 키만 수정 가능
CREATE POLICY "Users can update own api_keys"
  ON public.api_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 사용자는 자신의 API 키만 삭제 가능
CREATE POLICY "Users can delete own api_keys"
  ON public.api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

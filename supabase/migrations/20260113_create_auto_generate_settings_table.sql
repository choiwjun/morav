-- 자동 생성 설정 테이블 생성
CREATE TABLE IF NOT EXISTS auto_generate_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  preferred_provider TEXT DEFAULT 'openai' CHECK (preferred_provider IN ('openai', 'claude', 'gemini', 'grok')),
  preferred_categories TEXT[] DEFAULT '{}',
  posts_per_day INTEGER DEFAULT 1 CHECK (posts_per_day >= 1 AND posts_per_day <= 10),
  default_blog_id UUID REFERENCES blogs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS 정책 활성화
ALTER TABLE auto_generate_settings ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 설정만 조회/수정 가능
CREATE POLICY "Users can view own auto_generate_settings"
  ON auto_generate_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own auto_generate_settings"
  ON auto_generate_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auto_generate_settings"
  ON auto_generate_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own auto_generate_settings"
  ON auto_generate_settings FOR DELETE
  USING (auth.uid() = user_id);

-- 인덱스 생성
CREATE INDEX idx_auto_generate_settings_user_id ON auto_generate_settings(user_id);
CREATE INDEX idx_auto_generate_settings_enabled ON auto_generate_settings(is_enabled) WHERE is_enabled = true;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_auto_generate_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_settings_updated_at
  BEFORE UPDATE ON auto_generate_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_auto_generate_settings_updated_at();

-- 코멘트 추가
COMMENT ON TABLE auto_generate_settings IS '자동 콘텐츠 생성 설정';
COMMENT ON COLUMN auto_generate_settings.is_enabled IS '자동 생성 활성화 여부';
COMMENT ON COLUMN auto_generate_settings.preferred_provider IS '선호 AI 제공자';
COMMENT ON COLUMN auto_generate_settings.preferred_categories IS '선호 키워드 카테고리 목록';
COMMENT ON COLUMN auto_generate_settings.posts_per_day IS '일일 최대 생성 수';
COMMENT ON COLUMN auto_generate_settings.default_blog_id IS '기본 발행 블로그';

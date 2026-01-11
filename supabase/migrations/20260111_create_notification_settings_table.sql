-- 알림 설정 테이블
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- 이메일 알림 설정
  email_on_publish_success BOOLEAN DEFAULT true,
  email_on_publish_fail BOOLEAN DEFAULT true,
  email_on_subscription_change BOOLEAN DEFAULT true,
  email_on_usage_limit BOOLEAN DEFAULT true,

  -- 마케팅/뉴스레터
  email_marketing BOOLEAN DEFAULT false,
  email_newsletter BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림 설정만 조회 가능
CREATE POLICY "Users can view own notification settings"
  ON notification_settings FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 알림 설정만 삽입 가능
CREATE POLICY "Users can insert own notification settings"
  ON notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 알림 설정만 업데이트 가능
CREATE POLICY "Users can update own notification settings"
  ON notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);

-- 회원가입 시 기본 알림 설정 자동 생성 함수
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거
DROP TRIGGER IF EXISTS on_user_created_notification_settings ON auth.users;
CREATE TRIGGER on_user_created_notification_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_notification_settings();

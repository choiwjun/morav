-- Subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'light', 'standard', 'pro', 'unlimited')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  monthly_limit INTEGER NOT NULL DEFAULT 10,
  usage_count INTEGER NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days') NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_plan_idx ON public.subscriptions(plan);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 구독만 조회 가능
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 구독만 생성 가능
CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 구독만 수정 가능
CREATE POLICY "Users can update own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 플랜별 월간 한도 정의 (참조용 주석)
-- free: 10개
-- light: 30개
-- standard: 100개
-- pro: 300개
-- unlimited: 무제한 (999999)

-- Payment History 테이블 생성
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  payment_key TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'light', 'standard', 'pro', 'unlimited')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'failed')),
  method TEXT, -- 결제 수단 (카드, 계좌이체 등)
  card_company TEXT, -- 카드사
  card_number TEXT, -- 마스킹된 카드번호
  receipt_url TEXT, -- 영수증 URL
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS payment_history_user_id_idx ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS payment_history_payment_key_idx ON public.payment_history(payment_key);
CREATE INDEX IF NOT EXISTS payment_history_status_idx ON public.payment_history(status);
CREATE INDEX IF NOT EXISTS payment_history_created_at_idx ON public.payment_history(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 결제 내역만 조회 가능
CREATE POLICY "Users can view own payment history"
  ON public.payment_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- 시스템만 결제 내역 생성 가능 (서버 사이드에서만)
CREATE POLICY "System can insert payment history"
  ON public.payment_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 시스템만 결제 내역 수정 가능 (취소 처리용)
CREATE POLICY "System can update payment history"
  ON public.payment_history
  FOR UPDATE
  USING (auth.uid() = user_id);

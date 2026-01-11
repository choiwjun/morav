-- Keywords 테이블 생성
CREATE TABLE IF NOT EXISTS public.keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('naver', 'google')),
  trend_score INTEGER DEFAULT 0 NOT NULL,
  collected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- 1시간 단위 중복 방지를 위한 컬럼 (YYYY-MM-DD-HH 형식)
  -- GENERATED ALWAYS AS는 AT TIME ZONE이 IMMUTABLE하지 않아 사용 불가
  collected_hour TEXT NOT NULL DEFAULT to_char(NOW(), 'YYYY-MM-DD-HH24')
);

-- collected_hour 자동 설정 함수
CREATE OR REPLACE FUNCTION public.set_keywords_collected_hour()
RETURNS TRIGGER AS $$
BEGIN
  NEW.collected_hour = to_char(COALESCE(NEW.collected_at, NOW()) AT TIME ZONE 'UTC', 'YYYY-MM-DD-HH24');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (기존 트리거 있으면 삭제)
DROP TRIGGER IF EXISTS set_keywords_collected_hour_trigger ON public.keywords;
CREATE TRIGGER set_keywords_collected_hour_trigger
  BEFORE INSERT OR UPDATE ON public.keywords
  FOR EACH ROW EXECUTE FUNCTION public.set_keywords_collected_hour();

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS keywords_category_idx ON public.keywords(category);
CREATE INDEX IF NOT EXISTS keywords_source_idx ON public.keywords(source);
CREATE INDEX IF NOT EXISTS keywords_collected_at_idx ON public.keywords(collected_at);

-- 1시간 이내 중복 키워드 방지를 위한 unique constraint
-- (같은 키워드가 같은 소스에서 1시간 이내에 수집되면 무시)
CREATE UNIQUE INDEX IF NOT EXISTS keywords_keyword_source_hour_idx
  ON public.keywords(keyword, source, collected_hour);

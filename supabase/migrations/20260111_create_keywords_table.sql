-- Keywords 테이블 생성
CREATE TABLE IF NOT EXISTS public.keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('naver', 'google')),
  trend_score INTEGER DEFAULT 0 NOT NULL,
  collected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- 1시간 단위 중복 방지를 위한 컬럼 (YYYY-MM-DD-HH 형식)
  collected_hour TEXT GENERATED ALWAYS AS (to_char(collected_at AT TIME ZONE 'UTC', 'YYYY-MM-DD-HH24')) STORED
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS keywords_category_idx ON public.keywords(category);
CREATE INDEX IF NOT EXISTS keywords_source_idx ON public.keywords(source);
CREATE INDEX IF NOT EXISTS keywords_collected_at_idx ON public.keywords(collected_at);

-- 1시간 이내 중복 키워드 방지를 위한 unique constraint
-- (같은 키워드가 같은 소스에서 1시간 이내에 수집되면 무시)
CREATE UNIQUE INDEX IF NOT EXISTS keywords_keyword_source_hour_idx
  ON public.keywords(keyword, source, collected_hour);

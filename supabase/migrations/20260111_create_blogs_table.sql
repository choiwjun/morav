-- Blogs 테이블 생성
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tistory', 'blogger', 'wordpress')),
  blog_name TEXT NOT NULL,
  blog_url TEXT NOT NULL,
  external_blog_id TEXT, -- 외부 블로그 ID (Blogger API 등에서 사용)
  username TEXT, -- WordPress 등에서 사용하는 사용자명
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  categories TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS blogs_user_id_idx ON public.blogs(user_id);
CREATE INDEX IF NOT EXISTS blogs_platform_idx ON public.blogs(platform);
CREATE UNIQUE INDEX IF NOT EXISTS blogs_user_platform_url_idx ON public.blogs(user_id, platform, blog_url);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 블로그만 조회 가능
CREATE POLICY "Users can view own blogs"
  ON public.blogs
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 블로그만 생성 가능
CREATE POLICY "Users can insert own blogs"
  ON public.blogs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 블로그만 수정 가능
CREATE POLICY "Users can update own blogs"
  ON public.blogs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 사용자는 자신의 블로그만 삭제 가능
CREATE POLICY "Users can delete own blogs"
  ON public.blogs
  FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

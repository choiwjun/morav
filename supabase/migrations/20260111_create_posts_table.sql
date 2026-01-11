-- Posts 테이블 생성
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE NOT NULL,
  keyword_id UUID REFERENCES public.keywords(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'generated', 'publishing', 'published', 'failed')),
  published_url TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0 NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS posts_blog_id_idx ON public.posts(blog_id);
CREATE INDEX IF NOT EXISTS posts_status_idx ON public.posts(status);
CREATE INDEX IF NOT EXISTS posts_scheduled_at_idx ON public.posts(scheduled_at);
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON public.posts(published_at);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 포스트만 조회 가능
CREATE POLICY "Users can view own posts"
  ON public.posts
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 포스트만 생성 가능
CREATE POLICY "Users can insert own posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 포스트만 수정 가능
CREATE POLICY "Users can update own posts"
  ON public.posts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 사용자는 자신의 포스트만 삭제 가능
CREATE POLICY "Users can delete own posts"
  ON public.posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

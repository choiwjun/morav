-- blogs 테이블에 외부 블로그 ID와 사용자명 컬럼 추가
-- 이미 존재하는 경우를 위해 IF NOT EXISTS 사용

DO $$
BEGIN
  -- external_blog_id 컬럼 추가 (Blogger API 등에서 사용)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'blogs'
    AND column_name = 'external_blog_id'
  ) THEN
    ALTER TABLE public.blogs ADD COLUMN external_blog_id TEXT;
  END IF;

  -- username 컬럼 추가 (WordPress 등에서 사용)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'blogs'
    AND column_name = 'username'
  ) THEN
    ALTER TABLE public.blogs ADD COLUMN username TEXT;
  END IF;
END $$;

COMMENT ON COLUMN public.blogs.external_blog_id IS '외부 블로그 ID (Blogger API 등에서 사용)';
COMMENT ON COLUMN public.blogs.username IS '블로그 사용자명 (WordPress 등에서 사용)';

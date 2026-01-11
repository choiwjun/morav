/**
 * 대시보드 관련 공통 유틸리티 함수
 */

/**
 * 상대 시간 포맷팅 (예: "5분 전", "2시간 전")
 */
export function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return '예약됨';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * 날짜/시간 포맷팅 (예: "2024년 1월 11일 오후 3:30")
 */
export function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 플랫폼 이름을 한글로 변환
 */
export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    tistory: '티스토리',
    google: '구글 블로거',
    blogger: '구글 블로거',
    wordpress: '워드프레스',
  };
  return labels[platform] || platform;
}

/**
 * 콘텐츠 요약 추출
 */
export function getContentExcerpt(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

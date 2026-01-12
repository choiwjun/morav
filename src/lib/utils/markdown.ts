/**
 * 마크다운을 HTML로 변환하는 유틸리티
 * 블로그 발행을 위한 완전한 마크다운 변환 지원
 */

/**
 * 마크다운을 HTML로 변환
 */
export function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // 코드 블록 (```language ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const langClass = lang ? ` class="language-${lang}"` : '';
    const escapedCode = escapeHtml(code.trim());
    return `<pre><code${langClass}>${escapedCode}</code></pre>`;
  });

  // 인라인 코드 (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 헤더 (### → h3, ## → h2, # → h1)
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // 수평선 (--- or ***)
  html = html.replace(/^(-{3,}|\*{3,})$/gm, '<hr/>');

  // 이미지 (![alt](url))
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // 링크 ([text](url))
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // 굵은 글씨 (**text** or __text__)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // 기울임 (*text* or _text_)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 취소선 (~~text~~)
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // 인용문 (> quote)
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  // 연속 blockquote 병합
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // 순서 없는 목록 (- item or * item)
  html = convertUnorderedList(html);

  // 순서 있는 목록 (1. item)
  html = convertOrderedList(html);

  // 단락 처리
  // 빈 줄로 구분된 텍스트를 <p> 태그로 감싸기
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      // 이미 블록 요소인 경우 p로 감싸지 않음
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<pre') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<hr') ||
        trimmed.startsWith('<img')
      ) {
        return trimmed;
      }
      // 줄바꿈을 <br>로 변환
      const withBreaks = trimmed.replace(/\n/g, '<br/>');
      return `<p>${withBreaks}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return html;
}

/**
 * 순서 없는 목록 변환
 */
function convertUnorderedList(html: string): string {
  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const match = line.match(/^[-*+] (.+)$/);
    if (match) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${match[1]}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(line);
    }
  }

  if (inList) {
    result.push('</ul>');
  }

  return result.join('\n');
}

/**
 * 순서 있는 목록 변환
 */
function convertOrderedList(html: string): string {
  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const match = line.match(/^\d+\. (.+)$/);
    if (match) {
      if (!inList) {
        result.push('<ol>');
        inList = true;
      }
      result.push(`<li>${match[1]}</li>`);
    } else {
      if (inList) {
        result.push('</ol>');
        inList = false;
      }
      result.push(line);
    }
  }

  if (inList) {
    result.push('</ol>');
  }

  return result.join('\n');
}

/**
 * HTML 특수문자 이스케이프
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 지정된 시간 동안 대기
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 블로그 URL에서 블로그 이름 추출
 * @example https://myblog.tistory.com → myblog
 */
export function extractBlogName(blogUrl: string): string {
  try {
    const url = new URL(blogUrl);
    const hostname = url.hostname;

    // tistory.com 형식
    if (hostname.endsWith('.tistory.com')) {
      return hostname.replace('.tistory.com', '');
    }

    // blogspot.com 형식
    if (hostname.endsWith('.blogspot.com')) {
      return hostname.replace('.blogspot.com', '');
    }

    // 일반 도메인의 경우 첫 번째 서브도메인 또는 도메인 이름 반환
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      // www 제외
      if (parts[0] === 'www') {
        return parts[1];
      }
      return parts[0];
    }

    return hostname;
  } catch {
    // URL 파싱 실패 시 원본 반환
    return blogUrl;
  }
}

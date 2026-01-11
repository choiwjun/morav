# 모라브(Morav) - Coding Convention & AI Collaboration Guide

## 1. 핵심 원칙: "신뢰하되, 검증하라"

AI 코딩 파트너(Cursor, Claude)는 강력한 도구이지만, 생성된 코드는 항상 검증이 필요합니다. 이 가이드는 일관성, 보안, 유지보수성을 확보하기 위한 규칙을 정의합니다.

---

## 2. 프로젝트 설정 및 기술 스택

### 필수 도구
- **Node.js**: 20.x LTS
- **패키지 매니저**: pnpm (빠른 설치, 디스크 절약)
- **TypeScript**: 5.x (타입 안정성)
- **ESLint + Prettier**: 코드 포맷 자동화

### 버전 관리
- Git 브랜치 전략: `main` (프로덕션), `dev` (개발)
- 커밋 메시지: Conventional Commits 규칙
  - `feat:` 새 기능
  - `fix:` 버그 수정
  - `docs:` 문서 수정
  - `refactor:` 리팩토링
  - `test:` 테스트 추가

---

## 3. 아키텍처 및 모듈성

### 폴더 구조
```
/app
  /dashboard        # 대시보드 페이지
  /onboarding       # 온보딩 플로우
  /auth             # 인증 페이지
  /api              # API Routes
    /cron           # Cron Jobs
    /auth           # 인증 엔드포인트
    /generate       # AI 콘텐츠 생성
/components
  /ui               # shadcn/ui 컴포넌트
  /dashboard        # 대시보드 전용 컴포넌트
  /common           # 공통 컴포넌트
/lib
  /supabase         # Supabase 클라이언트
  /ai               # AI 콘텐츠 생성 로직
  /blog             # 블로그 플랫폼 연동
  /crypto           # 암호화/복호화
  /utils            # 유틸리티 함수
/types              # TypeScript 타입 정의
/public             # 정적 파일
```

### 컴포넌트 분리 원칙
- **Atomic Design**: Atom → Molecule → Organism
- **Single Responsibility**: 컴포넌트는 하나의 역할만
- **Props Typing**: 모든 Props는 TypeScript 인터페이스 정의
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
}
```

---

## 4. AI 소통 원칙 (프롬프트 엔지니어링)

### 효과적인 지시 방법

**❌ 나쁜 예:**
```
"로그인 페이지 만들어줘"
```

**✅ 좋은 예:**
```
"Next.js App Router를 사용하여 /app/auth/login/page.tsx에 로그인 페이지를 생성해줘.

요구사항:
- Supabase Auth의 signInWithPassword() 사용
- 이메일, 비밀번호 입력 필드 (shadcn/ui Input)
- 로그인 버튼 (shadcn/ui Button - Primary variant)
- 로그인 성공 시 /dashboard로 리다이렉트
- 에러 발생 시 Toast 메시지 표시
- TypeScript로 작성, 타입 안정성 확보

참조:
- PRD 4. 사용자 스토리
- Design System 문서 (Button, Input)
```

### AI에게 컨텍스트 제공하기
- 관련 문서(PRD, TRD) 섹션 명시
- 기존 코드 패턴 예시 제공
- 예상 에러 케이스 미리 언급

---

## 5. 코드 품질 및 보안

### TypeScript 엄격 모드
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 보안 체크리스트
- [ ] **환경 변수**: 민감한 키는 `.env.local`, 절대 Git 커밋 안 됨
- [ ] **API 키 암호화**: AES-256, `ENCRYPTION_SECRET_KEY` 32bytes
- [ ] **SQL Injection 방지**: Supabase 파라미터화된 쿼리 사용
- [ ] **XSS 방지**: 사용자 입력은 항상 sanitize (DOMPurify)
- [ ] **CSRF 방지**: Supabase Auth JWT 검증
- [ ] **Rate Limiting**: API Routes에 rate-limiter-flexible 적용

### 암호화 예제
```typescript
// /lib/crypto.ts
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_SECRET_KEY!;

if (!secretKey || secretKey.length !== 64) { // 32 bytes = 64 hex chars
  throw new Error('Invalid ENCRYPTION_SECRET_KEY');
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    algorithm, 
    Buffer.from(secretKey, 'hex'), 
    iv
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipheriv(
    algorithm, 
    Buffer.from(secretKey, 'hex'), 
    iv
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## 6. 테스트 및 디버깅

### 테스트 전략
- **단위 테스트**: Jest로 유틸 함수 테스트
- **통합 테스트**: API Routes 테스트
- **E2E 테스트**: Playwright로 주요 플로우 테스트

### 테스트 예제
```typescript
// /lib/crypto.test.ts
import { encrypt, decrypt } from './crypto';

describe('Crypto Utils', () => {
  it('should encrypt and decrypt correctly', () => {
    const original = 'sk-1234567890abcdef';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    
    expect(decrypted).toBe(original);
    expect(encrypted).not.toBe(original);
  });
});
```

### 디버깅 워크플로우
1. **에러 발생 시**:
   - Console 로그 확인
   - Sentry로 프로덕션 에러 추적
   - Vercel 로그 확인 (Cron, API Routes)
2. **성능 이슈**:
   - Next.js Performance Profiler
   - Supabase Query Explain Analyze
3. **네트워크 에러**:
   - Network 탭에서 요청/응답 확인
   - API 응답 코드 체크

---

## 7. AI 협업 체크리스트

### 코드 생성 전
- [ ] 명확한 요구사항 정의 (TASKS 문서 참조)
- [ ] 관련 문서 섹션 AI에게 제공
- [ ] 기존 코드 패턴 예시 제공

### 코드 생성 후
- [ ] TypeScript 에러 없음 (`npm run type-check`)
- [ ] ESLint 경고 없음 (`npm run lint`)
- [ ] 보안 체크리스트 확인
- [ ] 로컬 테스트 통과
- [ ] Git 커밋 전 Prettier 적용 (`npm run format`)

### AI 생성 코드 리뷰 포인트
- **타입 안정성**: `any` 사용 금지, 명시적 타입 정의
- **에러 핸들링**: try-catch 블록, 의미 있는 에러 메시지
- **성능**: 불필요한 리렌더링, N+1 쿼리 방지
- **가독성**: 변수명 명확, 주석은 Why에 집중

---

## 8. 프로젝트별 특수 규칙 (모라브)

### API 키 관리
- 사용자 API 키는 항상 암호화 후 저장
- 복호화는 서버 사이드에서만 (API Routes)
- 프론트엔드에 절대 노출 금지

### 블로그 플랫폼 연동
- OAuth 토큰 만료 시 자동 재인증 유도 (refresh token)
- 발행 실패 시 최대 3회 재시도
- 각 플랫폼별 rate limit 준수

### 키워드 수집
- 중복 키워드는 upsert (ON CONFLICT)
- 30일 지난 데이터 자동 삭제 (Cron)
- 카테고리 분류 정확도 모니터링

### 스케줄링
- 타임존: 사용자 현지 시각 기준 (DB는 UTC 저장)
- Cron 실패 시 알림 (Slack/이메일)
- 발행 지연 시 사용자에게 알림

---

## 9. 협업 워크플로우

### Pull Request 규칙
- 최소 1명 리뷰어 승인 필요
- PR 제목: `[FEAT-X] 기능명` (TASKS 번호 포함)
- 변경 사항 스크린샷 첨부 (UI 변경 시)

### 코드 리뷰 체크리스트
- [ ] 요구사항 충족 확인
- [ ] 보안 이슈 없음
- [ ] 테스트 통과
- [ ] 문서 업데이트 (필요 시)

---

## 10. 문제 해결 가이드

### 자주 발생하는 이슈

**이슈 1: Supabase RLS 정책 에러**
- 증상: "Row Level Security policy violated"
- 해결: RLS 정책 확인, `auth.uid()`가 올바른지 체크

**이슈 2: Vercel Cron 미실행**
- 증상: 키워드 수집/자동 발행 안 됨
- 해결: `vercel.json` 경로 확인, Vercel Pro 플랜 확인

**이슈 3: API 키 복호화 실패**
- 증상: "Invalid IV length" 에러
- 해결: `ENCRYPTION_SECRET_KEY` 길이 확인 (64 hex chars)

**이슈 4: 블로그 OAuth 토큰 만료**
- 증상: 발행 실패 (401 Unauthorized)
- 해결: 재인증 유도 UI 표시, refresh token 구현

---

## 11. 지속적 개선

### 성능 모니터링
- Vercel Analytics로 페이지 로딩 시간 추적
- Supabase Dashboard에서 느린 쿼리 찾기
- 매주 성능 리포트 리뷰

### 사용자 피드백 반영
- 월 1회 사용자 인터뷰
- 대시보드에 피드백 버튼 (Typeform 연동)
- 주요 개선 사항 로드맵에 반영

---

## 12. 최종 체크리스트 (배포 전)

- [ ] 모든 환경 변수 프로덕션 설정 완료
- [ ] Supabase RLS 정책 활성화
- [ ] 토스페이먼츠 라이브 키 적용
- [ ] Sentry 에러 추적 설정
- [ ] Vercel Cron Jobs 작동 확인
- [ ] SSL 인증서 적용 (HTTPS)
- [ ] 도메인 연결 완료
- [ ] 백업 전략 수립 (Supabase 자동 백업)
- [ ] 모니터링 대시보드 설정
- [ ] 긴급 연락망 정리 (팀 슬랙/이메일)

---

## 13. 참고 자료

### 공식 문서
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [shadcn/ui 공식 문서](https://ui.shadcn.com)

### 유용한 도구
- [Vercel Analytics](https://vercel.com/analytics)
- [Sentry](https://sentry.io)
- [Playwright](https://playwright.dev)
- [ESLint](https://eslint.org)
- [Prettier](https://prettier.io)

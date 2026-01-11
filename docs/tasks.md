# Morav 개발 태스크

## 개요

이 문서는 Morav 개발의 **실행 큐**입니다.
각 태스크는 `plan.md`에 정의된 TDD 원칙과 Tidy First 방법론을 따릅니다.

**태스크 상태 범례:**
- `[ ]` TODO - 시작 전
- `[~]` IN_PROGRESS - 진행 중
- `[x]` DONE - 완료됨
- `[-]` SKIPPED - 필요 없음

**작업 영역 범례:**
- 🎨 **FE** - 프론트엔드 (UI/UX, 컴포넌트, 페이지)
- ⚙️ **BE** - 백엔드 (API, 데이터베이스, 서버 로직)
- 🔧 **INFRA** - 인프라 (설정, 환경 구성)

---

## Phase 1: 기반 구축

### 1.1 프로젝트 초기화 (🔧 INFRA)

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 1.1.1 | Next.js 14+ 프로젝트를 TypeScript와 pnpm으로 초기화 | STRUCTURAL | 🔧 INFRA | [x] |
| 1.1.2 | tsconfig.json에서 TypeScript strict 모드 설정 | STRUCTURAL | 🔧 INFRA | [x] |
| 1.1.3 | Next.js 권장 규칙으로 ESLint 설정 | STRUCTURAL | 🔧 INFRA | [x] |
| 1.1.4 | 프로젝트 포맷팅 규칙으로 Prettier 설정 | STRUCTURAL | 🔧 INFRA | [x] |
| 1.1.5 | plan.md에 정의된 폴더 구조 생성 | STRUCTURAL | 🔧 INFRA | [x] |
| 1.1.6 | TypeScript와 함께 Jest 테스트 프레임워크 설정 | STRUCTURAL | 🔧 INFRA | [x] |
| 1.1.7 | E2E 테스트를 위한 Playwright 설정 | STRUCTURAL | 🔧 INFRA | [x] |
| 1.1.8 | 필수 변수가 포함된 .env.local 템플릿 생성 | STRUCTURAL | 🔧 INFRA | [x] |

### 1.2 Supabase 설정 (⚙️ BE)

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 1.2.1 | Supabase 클라이언트 패키지 설치 (@supabase/supabase-js, @supabase/ssr) | STRUCTURAL | ⚙️ BE | [x] |
| 1.2.2 | /lib/supabase에 Supabase 클라이언트 유틸리티 생성 | STRUCTURAL | ⚙️ BE | [x] |
| 1.2.3 | Supabase 스키마에서 데이터베이스 타입 생성 | STRUCTURAL | ⚙️ BE | [x] |
| 1.2.4 | 테스트: Supabase 클라이언트가 성공적으로 연결됨 | BEHAVIORAL | ⚙️ BE | [-] |

### 1.3 UI 기반 (🎨 FE)

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 1.3.1 | Tailwind CSS 설치 및 설정 | STRUCTURAL | 🎨 FE | [x] |
| 1.3.2 | 프로젝트 테마로 shadcn/ui 설정 | STRUCTURAL | 🎨 FE | [x] |
| 1.3.3 | Lucide React 아이콘 설치 | STRUCTURAL | 🎨 FE | [x] |
| 1.3.4 | 다양한 variant를 가진 기본 Button 컴포넌트 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 1.3.5 | 다양한 상태를 가진 기본 Input 컴포넌트 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 1.3.6 | 기본 Card 컴포넌트 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 1.3.7 | 다양한 variant를 가진 Badge 컴포넌트 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 1.3.8 | ProgressBar 컴포넌트 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 1.3.9 | Toast 알림 시스템 생성 | BEHAVIORAL | 🎨 FE | [x] |

---

## Phase 2: 인증 및 사용자 관리

### 2.1 이메일 인증

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 2.1.1 | 테스트: 사용자가 이메일과 비밀번호로 회원가입 가능 | BEHAVIORAL | ⚙️ BE | [x] |
| 2.1.2 | 회원가입 API 라우트 /api/auth/signup 생성 | BEHAVIORAL | ⚙️ BE | [x] |
| 2.1.3 | 회원가입 페이지 UI /auth/signup 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 2.1.4 | 테스트: 사용자가 이메일과 비밀번호로 로그인 가능 | BEHAVIORAL | ⚙️ BE | [x] |
| 2.1.5 | 로그인 API 라우트 /api/auth/login 생성 | BEHAVIORAL | ⚙️ BE | [x] |
| 2.1.6 | 로그인 페이지 UI /auth/login 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 2.1.7 | 테스트: 사용자가 로그아웃 가능 | BEHAVIORAL | ⚙️ BE | [x] |
| 2.1.8 | 로그아웃 기능 생성 | BEHAVIORAL | ⚙️ BE | [x] |
| 2.1.9 | 테스트: 잘못된 자격 증명 시 에러 메시지 표시 | BEHAVIORAL | 🎨 FE | [x] |
| 2.1.10 | 로그인 에러 처리 구현 | BEHAVIORAL | 🎨 FE | [x] |

### 2.2 Google OAuth

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 2.2.1 | 테스트: 사용자가 Google로 로그인 가능 | BEHAVIORAL | ⚙️ BE | [x] |
| 2.2.2 | Supabase Google OAuth 제공자 설정 | STRUCTURAL | ⚙️ BE | [x] |
| 2.2.3 | Google OAuth 버튼 컴포넌트 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 2.2.4 | OAuth 콜백 및 세션 처리 | BEHAVIORAL | ⚙️ BE | [x] |

### 2.3 비밀번호 재설정

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 2.3.1 | 테스트: 사용자가 비밀번호 재설정 요청 가능 | BEHAVIORAL | ⚙️ BE | [x] |
| 2.3.2 | 비밀번호 재설정 요청 페이지 /auth/reset 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 2.3.3 | 비밀번호 재설정 확인 페이지 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 2.3.4 | 테스트: 사용자가 새 비밀번호 설정 가능 | BEHAVIORAL | ⚙️ BE | [x] |

### 2.4 사용자 프로필

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 2.4.1 | 테스트: 회원가입 시 사용자 프로필 생성됨 | BEHAVIORAL | ⚙️ BE | [x] |
| 2.4.2 | 프로필 생성을 위한 users 테이블 트리거 생성 | BEHAVIORAL | ⚙️ BE | [x] |
| 2.4.3 | 테스트: 사용자가 자신의 프로필 조회 가능 | BEHAVIORAL | ⚙️ BE | [x] |
| 2.4.4 | 프로필 설정 페이지 /settings/profile 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 2.4.5 | 테스트: 사용자가 이름 업데이트 가능 | BEHAVIORAL | ⚙️ BE | [x] |
| 2.4.6 | 프로필 업데이트 기능 구현 | BEHAVIORAL | ⚙️ BE | [x] |

---

## Phase 3: 온보딩 플로우

### 3.1 온보딩 레이아웃

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 3.1.1 | OnboardingProgress 컴포넌트 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 3.1.2 | 네비게이션이 포함된 온보딩 레이아웃 생성 | STRUCTURAL | 🎨 FE | [x] |
| 3.1.3 | 테스트: 온보딩이 인증되지 않은 사용자를 리다이렉트 | BEHAVIORAL | ⚙️ BE | [x] |

### 3.2 블로그 연결 (Step 1)

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 3.2.1 | 데이터베이스에 blogs 테이블 생성 | STRUCTURAL | ⚙️ BE | [x] |
| 3.2.2 | 테스트: 사용자가 OAuth로 티스토리 블로그 연결 가능 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.2.3 | 티스토리 OAuth 플로우 구현 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.2.4 | 테스트: 사용자가 OAuth로 구글 블로거 연결 가능 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.2.5 | 구글 블로거 OAuth 플로우 구현 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.2.6 | 테스트: 사용자가 워드프레스 블로그 연결 가능 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.2.7 | 워드프레스 연결 구현 (Application Password) | BEHAVIORAL | ⚙️ BE | [x] |
| 3.2.8 | 블로그 연결 페이지 UI /onboarding/connect-blog 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 3.2.9 | 테스트: OAuth 토큰이 저장 전 암호화됨 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.2.10 | 테스트: 사용자가 블로그 연결 해제 가능 | BEHAVIORAL | ⚙️ BE | [x] |

### 3.3 AI API 키 등록 (Step 2)

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 3.3.1 | 데이터베이스에 api_keys 테이블 생성 | STRUCTURAL | ⚙️ BE | [x] |
| 3.3.2 | 테스트: encrypt 함수가 텍스트를 올바르게 암호화 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.3.3 | 암호화 유틸리티 /lib/crypto.ts 생성 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.3.4 | 테스트: decrypt 함수가 텍스트를 올바르게 복호화 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.3.5 | 테스트: 사용자가 OpenAI API 키 등록 가능 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.3.6 | API 키 검증 엔드포인트 생성 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.3.7 | API 키 등록 페이지 UI /onboarding/api-key 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 3.3.8 | 테스트: 유효하지 않은 API 키 시 에러 표시 | BEHAVIORAL | 🎨 FE | [x] |
| 3.3.9 | Claude API 키 검증 구현 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.3.10 | Gemini API 키 검증 구현 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.3.11 | Grok API 키 검증 구현 | BEHAVIORAL | ⚙️ BE | [x] |

### 3.4 카테고리 선택 (Step 3)

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 3.4.1 | 카테고리 상수 정의 | STRUCTURAL | ⚙️ BE | [x] |
| 3.4.2 | 테스트: 사용자가 여러 카테고리 선택 가능 | BEHAVIORAL | 🎨 FE | [x] |
| 3.4.3 | 카테고리 선택 페이지 UI /onboarding/category 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 3.4.4 | 테스트: 선택된 카테고리가 blog 레코드에 저장됨 | BEHAVIORAL | ⚙️ BE | [x] |

### 3.5 스케줄 설정 (Step 4)

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 3.5.1 | schedules 테이블 생성 또는 users 테이블에 추가 | STRUCTURAL | ⚙️ BE | [x] |
| 3.5.2 | 테스트: 사용자가 발행 시간 설정 가능 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.5.3 | 테스트: 사용자가 발행 요일 선택 가능 | BEHAVIORAL | ⚙️ BE | [x] |
| 3.5.4 | 스케줄 설정 페이지 UI /onboarding/schedule 생성 | BEHAVIORAL | 🎨 FE | [x] |
| 3.5.5 | 테스트: 온보딩 완료 시 대시보드로 리다이렉트 | BEHAVIORAL | 🎨 FE | [x] |

---

## Phase 4: 핵심 기능

### 4.1 대시보드

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 4.1.1 | 사이드바가 포함된 대시보드 레이아웃 생성 | STRUCTURAL | 🎨 FE | [ ] |
| 4.1.2 | MetricCard 컴포넌트 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 4.1.3 | 테스트: 대시보드가 오늘의 발행 통계 표시 | BEHAVIORAL | ⚙️ BE | [x] |
| 4.1.4 | 대시보드 메인 페이지 /dashboard 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 4.1.5 | 테스트: 대시보드가 최근 포스트 목록 표시 | BEHAVIORAL | ⚙️ BE | [x] |
| 4.1.6 | RecentPostsList 컴포넌트 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 4.1.7 | 테스트: 대시보드가 구독 상태 위젯 표시 | BEHAVIORAL | ⚙️ BE | [x] |
| 4.1.8 | SubscriptionWidget 컴포넌트 생성 | BEHAVIORAL | 🎨 FE | [ ] |

### 4.2 키워드 수집

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 4.2.1 | 데이터베이스에 keywords 테이블 생성 | STRUCTURAL | ⚙️ BE | [x] |
| 4.2.2 | 테스트: 키워드 크롤러가 네이버 트렌드 수집 | BEHAVIORAL | ⚙️ BE | [x] |
| 4.2.3 | 네이버 트렌드 키워드 스크래퍼 구현 | BEHAVIORAL | ⚙️ BE | [x] |
| 4.2.4 | 테스트: 키워드 크롤러가 구글 트렌드 수집 | BEHAVIORAL | ⚙️ BE | [x] |
| 4.2.5 | 구글 트렌드 키워드 스크래퍼 구현 | BEHAVIORAL | ⚙️ BE | [x] |
| 4.2.6 | 테스트: 키워드가 올바르게 분류됨 | BEHAVIORAL | ⚙️ BE | [x] |
| 4.2.7 | 키워드 분류 로직 구현 | BEHAVIORAL | ⚙️ BE | [x] |
| 4.2.8 | 매시간 키워드 수집 Cron job 생성 | BEHAVIORAL | ⚙️ BE | [x] |
| 4.2.9 | 테스트: 1시간 내 중복 키워드는 저장되지 않음 | BEHAVIORAL | ⚙️ BE | [x] |
| 4.2.10 | 키워드 탐색 페이지 /dashboard/keywords 생성 | BEHAVIORAL | 🎨 FE | [ ] |

### 4.3 AI 콘텐츠 생성

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 4.3.1 | 데이터베이스에 posts 테이블 생성 | STRUCTURAL | ⚙️ BE | [ ] |
| 4.3.2 | 테스트: OpenAI가 키워드로 콘텐츠 생성 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.3.3 | OpenAI 콘텐츠 생성기 /lib/ai/openai.ts 생성 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.3.4 | 테스트: Claude가 키워드로 콘텐츠 생성 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.3.5 | Claude 콘텐츠 생성기 /lib/ai/claude.ts 생성 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.3.6 | 테스트: Gemini가 키워드로 콘텐츠 생성 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.3.7 | Gemini 콘텐츠 생성기 /lib/ai/gemini.ts 생성 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.3.8 | 테스트: 생성된 콘텐츠가 최소 1500자 이상 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.3.9 | 통합 AI 생성기 인터페이스 생성 | STRUCTURAL | ⚙️ BE | [ ] |
| 4.3.10 | 테스트: AI가 콘텐츠용 이미지 생성 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.3.11 | AI 이미지 생성 구현 | BEHAVIORAL | ⚙️ BE | [ ] |

### 4.4 자동 발행

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 4.4.1 | 테스트: 콘텐츠를 티스토리에 발행 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.4.2 | 티스토리 발행 클라이언트 /lib/blog/tistory.ts 생성 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.4.3 | 테스트: 콘텐츠를 구글 블로거에 발행 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.4.4 | 블로거 발행 클라이언트 /lib/blog/blogger.ts 생성 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.4.5 | 테스트: 콘텐츠를 워드프레스에 발행 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.4.6 | 워드프레스 발행 클라이언트 /lib/blog/wordpress.ts 생성 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.4.7 | 통합 블로그 발행기 인터페이스 생성 | STRUCTURAL | ⚙️ BE | [ ] |
| 4.4.8 | 테스트: 예약된 포스트가 정확한 시간에 발행됨 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.4.9 | 발행 Cron job 생성 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.4.10 | 테스트: 발행 실패 시 최대 3회 재시도 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.4.11 | 지수 백오프로 재시도 로직 구현 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.4.12 | 테스트: 발행 후 포스트 상태 업데이트 | BEHAVIORAL | ⚙️ BE | [ ] |

### 4.5 포스트 관리

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 4.5.1 | 테스트: 사용자가 자신의 모든 포스트 조회 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.5.2 | 포스트 목록 페이지 /dashboard/posts 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 4.5.3 | 테스트: 사용자가 상태별로 포스트 필터링 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.5.4 | 포스트 필터링 구현 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.5.5 | 테스트: 사용자가 블로그별로 포스트 필터링 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.5.6 | 테스트: 사용자가 제목으로 포스트 검색 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.5.7 | 포스트 검색 구현 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.5.8 | 테스트: 사용자가 실패한 포스트 재시도 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 4.5.9 | 수동 재시도 기능 구현 | BEHAVIORAL | ⚙️ BE | [ ] |

---

## Phase 5: 구독 및 결제

### 5.1 구독 관리

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 5.1.1 | 데이터베이스에 subscriptions 테이블 생성 | STRUCTURAL | ⚙️ BE | [ ] |
| 5.1.2 | 테스트: 회원가입 시 무료 체험 구독 생성됨 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.1.3 | 무료 체험 생성 구현 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.1.4 | 테스트: 발행 시 사용량 카운트 증가 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.1.5 | 사용량 추적 구현 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.1.6 | 테스트: 한도 도달 시 발행 차단됨 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.1.7 | 사용량 한도 적용 구현 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.1.8 | 테스트: 사용량이 매월 초기화됨 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.1.9 | 사용량 초기화 Cron job 생성 | BEHAVIORAL | ⚙️ BE | [ ] |

### 5.2 결제 연동

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 5.2.1 | 토스페이먼츠 SDK 설치 | STRUCTURAL | ⚙️ BE | [ ] |
| 5.2.2 | 플랜 선택 페이지 /payment/plans 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 5.2.3 | 테스트: 사용자가 플랜 선택 가능 | BEHAVIORAL | 🎨 FE | [ ] |
| 5.2.4 | 결제 페이지 /payment/checkout 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 5.2.5 | 테스트: 결제 위젯이 올바르게 렌더링됨 | BEHAVIORAL | 🎨 FE | [ ] |
| 5.2.6 | 토스페이먼츠 위젯 구현 | BEHAVIORAL | 🎨 FE | [ ] |
| 5.2.7 | 테스트: 성공적인 결제가 구독 생성 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.2.8 | 결제 성공 핸들러 /api/payment/success 생성 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.2.9 | 결제 성공 페이지 /payment/success 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 5.2.10 | 테스트: 결제 실패 시 에러 표시 | BEHAVIORAL | 🎨 FE | [ ] |
| 5.2.11 | 결제 실패 페이지 /payment/fail 생성 | BEHAVIORAL | 🎨 FE | [ ] |

### 5.3 구독 설정

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 5.3.1 | 테스트: 사용자가 구독 상세 정보 조회 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.3.2 | 구독 페이지 /settings/subscription 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 5.3.3 | 테스트: 사용자가 플랜 업그레이드 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.3.4 | 플랜 업그레이드 구현 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.3.5 | 테스트: 사용자가 구독 취소 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.3.6 | 구독 취소 구현 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.3.7 | 테스트: 사용자가 결제 내역 조회 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 5.3.8 | 결제 내역 컴포넌트 생성 | BEHAVIORAL | 🎨 FE | [ ] |

---

## Phase 6: 설정 및 마무리

### 6.1 블로그 설정

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 6.1.1 | 테스트: 사용자가 연결된 블로그 조회 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 6.1.2 | 블로그 설정 페이지 /settings/blogs 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 6.1.3 | 테스트: 사용자가 새 블로그 추가 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 6.1.4 | 테스트: 사용자가 블로그 삭제 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 6.1.5 | 테스트: 사용자가 블로그 카테고리 업데이트 가능 | BEHAVIORAL | ⚙️ BE | [ ] |

### 6.2 API 키 설정

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 6.2.1 | 테스트: 사용자가 등록된 API 키 조회 가능 (마스킹됨) | BEHAVIORAL | ⚙️ BE | [ ] |
| 6.2.2 | API 키 페이지 /settings/api-keys 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 6.2.3 | 테스트: 사용자가 새 API 키 추가 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 6.2.4 | 테스트: 사용자가 API 키 삭제 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 6.2.5 | 테스트: 사용자가 API 키 재검증 가능 | BEHAVIORAL | ⚙️ BE | [ ] |

### 6.3 알림 설정

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 6.3.1 | 데이터베이스에 알림 설정 생성 | STRUCTURAL | ⚙️ BE | [ ] |
| 6.3.2 | 테스트: 사용자가 이메일 알림 토글 가능 | BEHAVIORAL | ⚙️ BE | [ ] |
| 6.3.3 | 알림 페이지 /settings/notifications 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 6.3.4 | 테스트: 발행 성공 시 사용자가 이메일 수신 | BEHAVIORAL | ⚙️ BE | [ ] |
| 6.3.5 | 이메일 알림 시스템 구현 | BEHAVIORAL | ⚙️ BE | [ ] |

### 6.4 랜딩 페이지

| ID | 태스크 | 유형 | 영역 | 상태 |
|----|--------|------|------|------|
| 6.4.1 | Hero 섹션 컴포넌트 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 6.4.2 | 문제점 및 해결책 섹션 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 6.4.3 | 작동 방식 섹션 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 6.4.4 | 기능 소개 섹션 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 6.4.5 | 요금제 섹션 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 6.4.6 | 사용자 후기 섹션 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 6.4.7 | 아코디언이 포함된 FAQ 섹션 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 6.4.8 | 최종 CTA 섹션 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 6.4.9 | Footer 컴포넌트 생성 | BEHAVIORAL | 🎨 FE | [ ] |
| 6.4.10 | 랜딩 페이지 / 조립 | BEHAVIORAL | 🎨 FE | [ ] |

---

## 진행 요약

### 전체 진행률

| Phase | 전체 태스크 | 완료 | 진행률 |
|-------|-------------|------|--------|
| Phase 1: 기반 구축 | 21 | 20 | 95% |
| Phase 2: 인증 | 18 | 18 | 100% |
| Phase 3: 온보딩 | 24 | 24 | 100% |
| Phase 4: 핵심 기능 | 41 | 12 | 29% |
| Phase 5: 구독 | 19 | 0 | 0% |
| Phase 6: 설정 및 마무리 | 19 | 0 | 0% |
| **전체** | **142** | **74** | **52%** |

### 영역별 진행률

| 영역 | 전체 태스크 | 완료 | 진행률 |
|------|-------------|------|--------|
| 🎨 FE (프론트엔드) | 50 | 15 | 30% |
| ⚙️ BE (백엔드) | 84 | 51 | 61% |
| 🔧 INFRA (인프라) | 8 | 8 | 100% |
| **전체** | **142** | **74** | **52%** |

---

## 영역별 태스크 요약

### 🎨 프론트엔드 태스크 (50개)

**UI 컴포넌트:**
- Button, Input, Card, Badge, ProgressBar, Toast 컴포넌트
- MetricCard, RecentPostsList, SubscriptionWidget 컴포넌트
- OnboardingProgress 컴포넌트
- Google OAuth 버튼, 결제 내역 컴포넌트

**페이지:**
- 인증: /auth/signup, /auth/login, /auth/reset
- 온보딩: /onboarding/connect-blog, /onboarding/api-key, /onboarding/category, /onboarding/schedule
- 대시보드: /dashboard, /dashboard/keywords, /dashboard/posts
- 설정: /settings/profile, /settings/blogs, /settings/api-keys, /settings/notifications, /settings/subscription
- 결제: /payment/plans, /payment/checkout, /payment/success, /payment/fail
- 랜딩: / (Hero, 문제점, 작동방식, 기능, 요금제, 후기, FAQ, CTA, Footer)

**레이아웃:**
- 온보딩 레이아웃
- 대시보드 레이아웃 (사이드바 포함)

### ⚙️ 백엔드 태스크 (84개)

**데이터베이스:**
- Supabase 클라이언트 설정
- 테이블: blogs, api_keys, keywords, posts, subscriptions, 알림 설정
- 데이터베이스 타입 생성
- users 테이블 트리거

**인증:**
- 회원가입/로그인 API 라우트
- Google OAuth 설정 및 콜백
- 로그아웃 기능
- 비밀번호 재설정

**핵심 로직:**
- 암호화/복호화 유틸리티 (/lib/crypto.ts)
- API 키 검증 (OpenAI, Claude, Gemini, Grok)
- 블로그 OAuth (티스토리, 구글 블로거, 워드프레스)
- 키워드 스크래퍼 (네이버, 구글)
- AI 콘텐츠 생성기 (/lib/ai/)
- 블로그 발행 클라이언트 (/lib/blog/)

**Cron Jobs:**
- 키워드 수집 (매시간)
- 자동 발행
- 사용량 초기화 (매월)

**결제:**
- 토스페이먼츠 연동
- 구독 관리 (생성, 업그레이드, 취소)
- 사용량 추적 및 한도 적용

### 🔧 인프라 태스크 (8개)

- Next.js 프로젝트 초기화
- TypeScript strict 모드 설정
- ESLint, Prettier 설정
- 폴더 구조 생성
- Jest, Playwright 테스트 프레임워크 설정
- .env.local 템플릿 생성

---

## 변경 로그

| 날짜 | 태스크 ID | 변경 내용 | 작성자 |
|------|-----------|----------|--------|
| 2026-01-11 | - | 초기 tasks.md 생성 | Claude |
| 2026-01-11 | - | 한글 번역 완료 | Claude |
| 2026-01-11 | - | FE/BE/INFRA 영역 분류 추가 | Claude |
| 2026-01-11 | 2.1.1-2.4.6 | Phase 2 BE 작업 완료 (인증 및 사용자 관리) | Claude |
| 2026-01-11 | 3.2.1-3.2.10 | Phase 3.2 BE 작업 완료 (블로그 연결) | Claude |
| 2026-01-11 | 3.3.1-3.3.11 | Phase 3.3 BE 작업 완료 (AI API 키 등록) | Claude |
| 2026-01-11 | 3.4.1, 3.4.4 | Phase 3.4 BE 작업 완료 (카테고리 선택) | Claude |
| 2026-01-11 | 3.5.1-3.5.3 | Phase 3.5 BE 작업 완료 (스케줄 설정) | Claude |
| 2026-01-11 | 4.1.3, 4.1.5, 4.1.7 | Phase 4.1 BE 작업 완료 (대시보드) | Claude |
| 2026-01-11 | 4.2.1-4.2.7, 4.2.9 | Phase 4.2 BE 작업 완료 (키워드 수집) | Claude |
| 2026-01-11 | 4.2.8 | 매시간 키워드 수집 Cron job 생성 완료 | Claude |

---

## 참고 사항

- 각 태스크는 TDD를 따라 완료해야 함: 테스트를 먼저 작성, 그 다음 구현
- 태스크 완료 후, 상태를 업데이트하고 사용자의 "go" 명령을 기다림
- 태스크는 의존성 순서대로 나열됨; 명시되지 않는 한 순서대로 완료
- STRUCTURAL 태스크는 테스트가 필요 없음; BEHAVIORAL 태스크는 항상 테스트를 먼저 작성
- **🎨 FE**: UI/UX, 컴포넌트, 페이지, 클라이언트 사이드 로직
- **⚙️ BE**: API 라우트, 데이터베이스, 서버 사이드 로직, Cron Jobs
- **🔧 INFRA**: 프로젝트 설정, 환경 구성, 빌드/테스트 도구

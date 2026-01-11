# 모라브(Morav) - Design System (기초 디자인 시스템)

## 1. 색상 팔레트 (Color Palette)

### Primary (주요 색상)
- **Primary-500**: `#3B82F6` (Blue) - 주요 CTA, 링크
- **Primary-600**: `#2563EB` (Dark Blue) - Hover 상태
- **Primary-400**: `#60A5FA` (Light Blue) - 비활성 상태
- **Primary-50**: `#EFF6FF` (Very Light Blue) - 배경 강조

### Secondary (보조 색상)
- **Secondary-500**: `#10B981` (Green) - 성공 메시지, 발행 완료
- **Secondary-600**: `#059669` (Dark Green) - Hover
- **Warning-500**: `#F59E0B` (Orange) - 경고, 남은 건수 알림
- **Error-500**: `#EF4444` (Red) - 에러, 발행 실패

### Neutral (중립 색상)
- **Gray-900**: `#111827` (거의 검정) - 주요 텍스트
- **Gray-700**: `#374151` - 부제목
- **Gray-500**: `#6B7280` - 설명 텍스트
- **Gray-300**: `#D1D5DB` - 비활성 요소
- **Gray-200**: `#E5E7EB` - 테두리
- **Gray-100**: `#F3F4F6` - 카드 배경
- **Gray-50**: `#F9FAFB` - 페이지 배경

### Surface (배경)
- **Background**: `#FFFFFF` (흰색) - 기본 배경
- **Surface**: `#F3F4F6` (연한 회색) - 카드, 패널

---

## 2. 타이포그래피 (Typography)

### Font Family
- **Primary**: `"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Monospace**: `"JetBrains Mono", "Courier New", monospace` (코드, API 키 표시용)

### Font Scale

| 스타일 | 크기 | 두께 | 행간 | 용도 |
|--------|------|------|------|------|
| **Heading 1** | 32px | 700 (Bold) | 40px | 페이지 제목 |
| **Heading 2** | 24px | 600 (SemiBold) | 32px | 섹션 제목 |
| **Heading 3** | 20px | 600 (SemiBold) | 28px | 카드 제목 |
| **Body Large** | 16px | 400 (Regular) | 24px | 본문 강조 |
| **Body** | 14px | 400 (Regular) | 20px | 기본 본문 |
| **Caption** | 12px | 400 (Regular) | 16px | 부가 설명 |
| **Code** | 14px | 400 (Mono) | 20px | API 키, 코드 |

### 사용 예시

```css
/* Heading 1 */
.heading-1 {
  font-size: 32px;
  font-weight: 700;
  line-height: 40px;
  color: #111827; /* Gray-900 */
}

/* Body */
.body {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #374151; /* Gray-700 */
}

/* Caption */
.caption {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: #6B7280; /* Gray-500 */
}
```

---

## 3. 간격 (Spacing)

Tailwind CSS 간격 시스템 사용:

| 이름 | 값 | 용도 |
|------|-----|------|
| **xs** | 4px | 아이콘 - 텍스트 간격 |
| **sm** | 8px | 컴포넌트 내부 간격 |
| **md** | 16px | 요소 간 기본 간격 |
| **lg** | 24px | 섹션 간 간격 |
| **xl** | 32px | 카드/패널 간격 |
| **2xl** | 48px | 큰 섹션 구분 |

### 적용 예시

```jsx
// 버튼 내부 패딩
<button className="px-6 py-3"> {/* 24px 좌우, 12px 상하 */}

// 카드 간격
<div className="space-y-6"> {/* 24px 세로 간격 */}

// 섹션 여백
<section className="mt-12 mb-12"> {/* 48px 상하 여백 */}
```

---

## 4. 기본 UI 컴포넌트 (Core Components)

### Button (버튼)

#### Primary Button
- **배경**: Primary-500 (`#3B82F6`)
- **텍스트**: White (`#FFFFFF`)
- **패딩**: 12px 24px
- **둥근 모서리**: 8px
- **폰트**: 14px, 600 (SemiBold)

**상태:**
- **Hover**: 배경 Primary-600 (`#2563EB`)
- **Active**: 배경 Primary-700, 살짝 아래로 이동
- **Disabled**: 배경 Gray-300, 텍스트 Gray-500

```jsx
<button className="
  bg-blue-500 hover:bg-blue-600 
  text-white font-semibold
  px-6 py-3 rounded-lg
  disabled:bg-gray-300 disabled:text-gray-500
">
  발행하기
</button>
```

#### Secondary Button
- **배경**: 투명
- **테두리**: 1px solid Gray-300
- **텍스트**: Gray-700
- **패딩**: 12px 24px

**상태:**
- **Hover**: 배경 Gray-50
- **Active**: 배경 Gray-100

```jsx
<button className="
  border border-gray-300 hover:bg-gray-50
  text-gray-700 font-semibold
  px-6 py-3 rounded-lg
">
  취소
</button>
```

---

### Input Field (입력 필드)

- **테두리**: 1px solid Gray-300
- **배경**: White
- **패딩**: 12px 16px
- **둥근 모서리**: 8px
- **폰트**: 14px

**상태:**
- **Focus**: 테두리 Primary-500, 그림자 `0 0 0 3px rgba(59, 130, 246, 0.1)`
- **Error**: 테두리 Error-500, 아래 에러 메시지 (Caption, Error-500 색상)
- **Disabled**: 배경 Gray-100, 텍스트 Gray-400

```jsx
<input 
  type="text"
  className="
    w-full border border-gray-300 rounded-lg
    px-4 py-3 text-sm
    focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100
    disabled:bg-gray-100 disabled:text-gray-400
  "
  placeholder="API 키를 입력하세요"
/>
```

---

### Card (카드)

- **배경**: White
- **테두리**: 1px solid Gray-200
- **둥근 모서리**: 12px
- **그림자**: `0 1px 3px rgba(0, 0, 0, 0.1)`
- **패딩**: 24px

```jsx
<div className="
  bg-white border border-gray-200 rounded-xl
  shadow-sm p-6
">
  {/* 카드 내용 */}
</div>
```

---

### Badge (배지)

#### Success Badge
- **배경**: Secondary-100 (연한 초록)
- **텍스트**: Secondary-700 (진한 초록)
- **패딩**: 4px 12px
- **폰트**: 12px, 600 (SemiBold)

```jsx
<span className="
  bg-green-100 text-green-700 font-semibold
  px-3 py-1 rounded-full text-xs
">
  발행 완료
</span>
```

#### Warning Badge
- **배경**: Warning-100
- **텍스트**: Warning-700

```jsx
<span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs">
  5건 남음
</span>
```

#### Error Badge
- **배경**: Error-100
- **텍스트**: Error-700

```jsx
<span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs">
  발행 실패
</span>
```

---

### Progress Bar (진행 바)

- **배경**: Gray-200
- **진행 색상**: Primary-500
- **높이**: 8px
- **둥근 모서리**: 4px

```jsx
<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className="bg-blue-500 h-2 rounded-full transition-all"
    style={{ width: '75%' }}
  ></div>
</div>
```

---

### Toast (알림)

- **배경**: Gray-900 (다크)
- **텍스트**: White
- **패딩**: 16px 24px
- **둥근 모서리**: 8px
- **위치**: 화면 하단 중앙
- **애니메이션**: 아래에서 위로 슬라이드

```jsx
<div className="
  fixed bottom-4 left-1/2 -translate-x-1/2
  bg-gray-900 text-white
  px-6 py-4 rounded-lg shadow-lg
  animate-slide-up
">
  ✅ 발행 완료!
</div>
```

---

## 5. 레이아웃 (Layout)

### Container
- **Max Width**: 1280px (데스크탑)
- **좌우 여백**: 16px (모바일), 24px (태블릿), 48px (데스크탑)

```jsx
<div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12">
  {/* 콘텐츠 */}
</div>
```

### Grid System
- **컬럼**: 12 컬럼
- **Gap**: 24px

```jsx
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-12 md:col-span-8"> {/* 메인 콘텐츠 */}
  <div className="col-span-12 md:col-span-4"> {/* 사이드바 */}
</div>
```

### Breakpoints

| 이름 | 최소 너비 | 용도 |
|------|----------|------|
| **sm** | 640px | 모바일 가로 |
| **md** | 768px | 태블릿 |
| **lg** | 1024px | 데스크탑 |
| **xl** | 1280px | 큰 데스크탑 |

```jsx
<div className="
  text-sm md:text-base lg:text-lg  {/* 반응형 폰트 */}
  px-4 md:px-6 lg:px-12             {/* 반응형 패딩 */}
">
```

---

## 6. 아이콘 (Icons)

### 라이브러리
- **Lucide React**: `npm install lucide-react`

### 크기
- **Small**: 16px
- **Medium**: 20px (기본)
- **Large**: 24px

### 사용 예시

```jsx
import { CheckCircle, XCircle, Clock } from 'lucide-react';

// 성공 아이콘
<CheckCircle className="w-5 h-5 text-green-500" />

// 실패 아이콘
<XCircle className="w-5 h-5 text-red-500" />

// 예약 아이콘
<Clock className="w-5 h-5 text-gray-500" />
```

---

## 7. 접근성 체크리스트 (Accessibility)

### 색상 대비
- [ ] 텍스트-배경 대비비 **4.5:1 이상** (WCAG AA 기준)
- [ ] 큰 텍스트(18px+) 대비비 **3:1 이상**

### 키보드 탐색
- [ ] 모든 인터랙티브 요소는 **Tab** 키로 접근 가능
- [ ] 포커스 상태가 **명확하게 시각적으로 표시**됨
- [ ] **Enter** 또는 **Space** 키로 버튼 활성화 가능

### 포커스 링
```css
/* 포커스 시 파란 아웃라인 */
.focus-visible:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}
```

### 스크린 리더
- [ ] 모든 이미지에 **alt 텍스트** 제공
- [ ] 버튼에 **aria-label** 제공 (아이콘만 있는 경우)
- [ ] 폼 필드에 **label** 연결

```jsx
// 좋은 예
<button aria-label="블로그 삭제">
  <Trash2 className="w-5 h-5" />
</button>

<img src="logo.png" alt="모라브 로고" />

<label htmlFor="email">이메일</label>
<input id="email" type="email" />
```

---

## 8. 다크 모드 (향후 확장)

현재 MVP는 라이트 모드만 지원하지만, 향후 다크 모드 추가 시 다음 색상을 사용:

### Dark Mode Colors
- **Background**: `#111827` (Gray-900)
- **Surface**: `#1F2937` (Gray-800)
- **Text**: `#F9FAFB` (Gray-50)
- **Border**: `#374151` (Gray-700)

---

## 9. 애니메이션 (Animation)

### 전환 효과
- **Duration**: 200ms (빠른 피드백), 300ms (기본)
- **Easing**: ease-in-out

```css
/* 버튼 호버 */
.button {
  transition: background-color 200ms ease-in-out;
}

/* 모달 열기 */
.modal {
  transition: opacity 300ms ease-in-out, transform 300ms ease-in-out;
}
```

### 로딩 스피너
```jsx
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
```

---

## 10. 반응형 디자인 원칙

### 모바일 우선 (Mobile First)
- 기본 스타일은 모바일 (< 640px)
- `md:`, `lg:` 브레이크포인트로 데스크탑 확장

### 터치 타겟 크기
- 버튼 최소 크기: **44x44px** (터치 편의성)

### 네비게이션
- **모바일**: 하단 탭 네비게이션
- **데스크탑**: 좌측 사이드바

---

## 11. 컴포넌트 사용 가이드

### 버튼 사용 시나리오

| 상황 | 버튼 타입 | 예시 |
|------|----------|------|
| 주요 액션 | Primary | "발행하기", "결제하기" |
| 보조 액션 | Secondary | "취소", "뒤로 가기" |
| 위험한 액션 | Error (빨강) | "삭제", "연동 해제" |

### 색상 사용 시나리오

| 의미 | 색상 | 용도 |
|------|------|------|
| 정보 | Blue (Primary) | 링크, CTA |
| 성공 | Green (Secondary) | 발행 완료, 성공 메시지 |
| 경고 | Orange (Warning) | 남은 건수 부족 |
| 에러 | Red (Error) | 발행 실패, 에러 메시지 |
| 중립 | Gray | 비활성 요소, 배경 |

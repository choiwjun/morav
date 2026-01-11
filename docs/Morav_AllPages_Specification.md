# 모라브(Morav) - 전체 페이지 UI/UX 및 기능 정의서

## 📋 문서 개요
- **작성일**: 2026-01-08
- **버전**: v1.0
- **범위**: 랜딩페이지 외 모든 주요 페이지

---

## 🗺️ 사이트맵 (Sitemap)

```
모라브 플랫폼
│
├── 🏠 랜딩페이지 (/)
│   └── [별도 문서 참조]
│
├── 🔐 인증 페이지
│   ├── 로그인 (/auth/login)
│   ├── 회원가입 (/auth/signup)
│   └── 비밀번호 재설정 (/auth/reset)
│
├── 🚀 온보딩 플로우 (/onboarding)
│   ├── Step 1: 블로그 연동 (/onboarding/connect-blog)
│   ├── Step 2: AI API 키 등록 (/onboarding/api-key)
│   ├── Step 3: 카테고리 설정 (/onboarding/category)
│   └── Step 4: 발행 시간 설정 (/onboarding/schedule)
│
├── 📊 대시보드 (/dashboard)
│   ├── 메인 대시보드 (/dashboard)
│   ├── 발행 관리 (/dashboard/posts)
│   ├── 키워드 탐색 (/dashboard/keywords)
│   └── 분석 리포트 (/dashboard/analytics)
│
├── ⚙️ 설정 (/settings)
│   ├── 프로필 (/settings/profile)
│   ├── 블로그 관리 (/settings/blogs)
│   ├── API 키 관리 (/settings/api-keys)
│   ├── 구독 플랜 (/settings/subscription)
│   └── 알림 설정 (/settings/notifications)
│
└── 💳 결제 (/payment)
    ├── 플랜 선택 (/payment/plans)
    ├── 결제 진행 (/payment/checkout)
    └── 결제 완료 (/payment/success)
```

---

# 📄 PAGE 1: 로그인 페이지 (/auth/login)

## 목적
- 기존 사용자의 빠른 로그인
- 소셜 로그인 옵션 제공

## 레이아웃
```
┌──────────────────────────────────────┐
│                                      │
│        [모라브 로고]                  │
│                                      │
│     "다시 오신 것을 환영합니다"       │
│                                      │
│   ┌──────────────────────────────┐   │
│   │  이메일 입력                  │   │
│   └──────────────────────────────┘   │
│                                      │
│   ┌──────────────────────────────┐   │
│   │  비밀번호 입력                │   │
│   └──────────────────────────────┘   │
│                                      │
│   [로그인 유지] [비밀번호 찾기]       │
│                                      │
│   [로그인 버튼]                       │
│                                      │
│   ───────── 또는 ─────────            │
│                                      │
│   [구글로 로그인]                     │
│                                      │
│   "계정이 없으신가요? [회원가입]"     │
└──────────────────────────────────────┘
```

## UI 컴포넌트

### 입력 필드
```jsx
<form onSubmit={handleLogin} className="space-y-6 max-w-md mx-auto">
  {/* 이메일 */}
  <div>
    <label htmlFor="email" className="block text-sm font-medium mb-2">
      이메일
    </label>
    <input
      id="email"
      type="email"
      required
      className="w-full border border-gray-300 rounded-lg px-4 py-3"
      placeholder="example@email.com"
    />
  </div>

  {/* 비밀번호 */}
  <div>
    <label htmlFor="password" className="block text-sm font-medium mb-2">
      비밀번호
    </label>
    <input
      id="password"
      type="password"
      required
      className="w-full border border-gray-300 rounded-lg px-4 py-3"
      placeholder="••••••••"
    />
  </div>

  {/* 옵션 */}
  <div className="flex justify-between items-center">
    <label className="flex items-center">
      <input type="checkbox" className="mr-2" />
      <span className="text-sm">로그인 유지</span>
    </label>
    <a href="/auth/reset" className="text-sm text-blue-500 hover:underline">
      비밀번호 찾기
    </a>
  </div>

  {/* 로그인 버튼 */}
  <Button type="submit" variant="primary" fullWidth size="lg">
    로그인
  </Button>

  {/* 소셜 로그인 */}
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300"></div>
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-4 bg-white text-gray-500">또는</span>
    </div>
  </div>

  <Button variant="outline" fullWidth className="flex items-center justify-center gap-2">
    <GoogleIcon />
    구글로 로그인
  </Button>

  {/* 회원가입 링크 */}
  <p className="text-center text-sm text-gray-600">
    계정이 없으신가요?{' '}
    <a href="/auth/signup" className="text-blue-500 font-semibold hover:underline">
      회원가입
    </a>
  </p>
</form>
```

## 기능 명세

### 로그인 처리
1. **이메일/비밀번호 검증**
   - 빈 값 체크
   - 이메일 형식 검증
   - 비밀번호 최소 8자 확인

2. **Supabase Auth 호출**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  // 에러 토스트 표시
  toast.error('이메일 또는 비밀번호가 일치하지 않습니다.');
  return;
}

// 성공 시 대시보드로 리다이렉트
router.push('/dashboard');
```

3. **소셜 로그인 (구글)**
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/dashboard`,
  },
});
```

### 에러 처리
- **잘못된 이메일/비밀번호**: "이메일 또는 비밀번호가 일치하지 않습니다."
- **네트워크 에러**: "연결에 문제가 발생했습니다. 다시 시도해주세요."
- **계정 비활성화**: "이 계정은 비활성화되었습니다. 고객센터에 문의하세요."

---

# 📄 PAGE 2: 회원가입 페이지 (/auth/signup)

## 목적
- 신규 사용자 계정 생성
- 무료 체험 즉시 시작

## 레이아웃
```
┌──────────────────────────────────────┐
│        [모라브 로고]                  │
│                                      │
│     "무료로 시작하세요"               │
│     "5건 무료 발행 제공"              │
│                                      │
│   ┌──────────────────────────────┐   │
│   │  이름 입력                    │   │
│   └──────────────────────────────┘   │
│                                      │
│   ┌──────────────────────────────┐   │
│   │  이메일 입력                  │   │
│   └──────────────────────────────┘   │
│                                      │
│   ┌──────────────────────────────┐   │
│   │  비밀번호 입력 (8자 이상)     │   │
│   └──────────────────────────────┘   │
│                                      │
│   [✓] 이용약관 동의 (필수)            │
│   [✓] 개인정보처리방침 동의 (필수)    │
│   [ ] 마케팅 수신 동의 (선택)         │
│                                      │
│   [회원가입 버튼]                     │
│                                      │
│   ───────── 또는 ─────────            │
│                                      │
│   [구글로 시작하기]                   │
│                                      │
│   "이미 계정이 있으신가요? [로그인]"  │
└──────────────────────────────────────┘
```

## UI 컴포넌트

```jsx
<form onSubmit={handleSignup} className="space-y-6 max-w-md mx-auto">
  {/* 이름 */}
  <div>
    <label htmlFor="name" className="block text-sm font-medium mb-2">
      이름
    </label>
    <input
      id="name"
      type="text"
      required
      className="w-full border border-gray-300 rounded-lg px-4 py-3"
      placeholder="홍길동"
    />
  </div>

  {/* 이메일 */}
  <div>
    <label htmlFor="email" className="block text-sm font-medium mb-2">
      이메일
    </label>
    <input
      id="email"
      type="email"
      required
      className="w-full border border-gray-300 rounded-lg px-4 py-3"
      placeholder="example@email.com"
    />
  </div>

  {/* 비밀번호 */}
  <div>
    <label htmlFor="password" className="block text-sm font-medium mb-2">
      비밀번호
    </label>
    <input
      id="password"
      type="password"
      required
      minLength={8}
      className="w-full border border-gray-300 rounded-lg px-4 py-3"
      placeholder="8자 이상 입력"
    />
    <p className="text-xs text-gray-500 mt-1">
      영문, 숫자, 특수문자 조합 8자 이상
    </p>
  </div>

  {/* 약관 동의 */}
  <div className="space-y-3 border-t pt-4">
    <label className="flex items-start">
      <input type="checkbox" required className="mt-1 mr-3" />
      <span className="text-sm">
        <a href="/terms" className="text-blue-500 underline">이용약관</a> 동의 (필수)
      </span>
    </label>
    
    <label className="flex items-start">
      <input type="checkbox" required className="mt-1 mr-3" />
      <span className="text-sm">
        <a href="/privacy" className="text-blue-500 underline">개인정보처리방침</a> 동의 (필수)
      </span>
    </label>
    
    <label className="flex items-start">
      <input type="checkbox" className="mt-1 mr-3" />
      <span className="text-sm text-gray-600">
        마케팅 수신 동의 (선택)
      </span>
    </label>
  </div>

  {/* 회원가입 버튼 */}
  <Button type="submit" variant="primary" fullWidth size="lg">
    무료로 시작하기
  </Button>
</form>
```

## 기능 명세

### 회원가입 처리
```typescript
async function handleSignup(e: FormEvent) {
  e.preventDefault();
  
  // 1. 유효성 검증
  if (!termsAccepted || !privacyAccepted) {
    toast.error('필수 약관에 동의해주세요.');
    return;
  }
  
  // 2. Supabase 회원가입
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        marketing_consent: marketingConsent,
      },
    },
  });
  
  if (authError) {
    toast.error(authError.message);
    return;
  }
  
  // 3. users 테이블에 추가 정보 저장
  const { error: dbError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      name,
      created_at: new Date().toISOString(),
    });
  
  // 4. 무료 구독 생성
  await createFreeSubscription(authData.user.id);
  
  // 5. 온보딩으로 리다이렉트
  router.push('/onboarding/connect-blog');
  toast.success('가입 완료! 블로그를 연동해주세요.');
}
```

---

# 📄 PAGE 3-6: 온보딩 플로우 (/onboarding)

## 전체 구조
```
Step 1 → Step 2 → Step 3 → Step 4 → Dashboard
블로그   API키   카테고리  스케줄   완료
연동     등록     설정      설정
```

## 공통 레이아웃
```
┌────────────────────────────────────────┐
│  [진행 표시바]                          │
│  ●━━━○━━━○━━━○  (1/4 완료)            │
├────────────────────────────────────────┤
│                                        │
│           [메인 콘텐츠 영역]            │
│                                        │
│                                        │
├────────────────────────────────────────┤
│  [이전]                    [다음 단계]  │
└────────────────────────────────────────┘
```

## 공통 UI 컴포넌트
```jsx
<div className="min-h-screen bg-gray-50">
  {/* 진행 표시 */}
  <OnboardingProgress currentStep={1} totalSteps={4} />
  
  {/* 메인 콘텐츠 */}
  <div className="max-w-3xl mx-auto px-6 py-12">
    <h1 className="text-3xl font-bold mb-2">{stepTitle}</h1>
    <p className="text-gray-600 mb-8">{stepDescription}</p>
    
    {/* Step별 콘텐츠 */}
    {children}
  </div>
  
  {/* 하단 네비게이션 */}
  <div className="fixed bottom-0 w-full bg-white border-t p-6">
    <div className="max-w-3xl mx-auto flex justify-between">
      <Button variant="outline" onClick={handlePrev}>
        이전
      </Button>
      <Button variant="primary" onClick={handleNext}>
        {isLastStep ? '완료' : '다음 단계'}
      </Button>
    </div>
  </div>
</div>
```

---

## STEP 1: 블로그 연동 (/onboarding/connect-blog)

### 레이아웃
```
┌────────────────────────────────────────┐
│  "블로그를 연동해주세요"                │
│  "최대 3개까지 연동 가능합니다"         │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  [티스토리 로고]                  │  │
│  │  티스토리                         │  │
│  │  [OAuth 연동하기]                │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  [구글 블로거 로고]               │  │
│  │  Google Blogger                  │  │
│  │  [OAuth 연동하기]                │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  [워드프레스 로고]                │  │
│  │  WordPress                       │  │
│  │  [연동하기]                       │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ───────────────────────────          │
│                                        │
│  연동된 블로그 (1/3)                   │
│  ✓ myblog.tistory.com                 │
└────────────────────────────────────────┘
```

### UI 컴포넌트
```jsx
<div className="space-y-6">
  {/* 티스토리 */}
  <Card className="p-6 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <img src="/logos/tistory.png" alt="Tistory" className="w-12 h-12" />
      <div>
        <h3 className="font-semibold">티스토리</h3>
        <p className="text-sm text-gray-500">Tistory</p>
      </div>
    </div>
    <Button variant="primary" onClick={() => handleOAuthConnect('tistory')}>
      OAuth 연동하기
    </Button>
  </Card>

  {/* 구글 블로거 */}
  <Card className="p-6 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <img src="/logos/blogger.png" alt="Blogger" className="w-12 h-12" />
      <div>
        <h3 className="font-semibold">Google Blogger</h3>
        <p className="text-sm text-gray-500">Blogger</p>
      </div>
    </div>
    <Button variant="primary" onClick={() => handleOAuthConnect('google')}>
      OAuth 연동하기
    </Button>
  </Card>

  {/* 워드프레스 */}
  <Card className="p-6 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <img src="/logos/wordpress.png" alt="WordPress" className="w-12 h-12" />
      <div>
        <h3 className="font-semibold">WordPress</h3>
        <p className="text-sm text-gray-500">자체 호스팅 블로그</p>
      </div>
    </div>
    <Button variant="primary" onClick={() => setShowWordPressModal(true)}>
      연동하기
    </Button>
  </Card>

  {/* 연동된 블로그 목록 */}
  {connectedBlogs.length > 0 && (
    <div className="border-t pt-6">
      <h3 className="font-semibold mb-4">연동된 블로그 ({connectedBlogs.length}/3)</h3>
      <div className="space-y-3">
        {connectedBlogs.map(blog => (
          <div key={blog.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500" />
              <span>{blog.url}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleRemoveBlog(blog.id)}>
              제거
            </Button>
          </div>
        ))}
      </div>
    </div>
  )}
</div>
```

### 기능 명세

**OAuth 플로우**
```typescript
async function handleOAuthConnect(platform: 'tistory' | 'google') {
  // 1. OAuth URL 생성
  const authUrl = generateOAuthUrl(platform);
  
  // 2. 팝업 창 열기
  const popup = window.open(authUrl, 'oauth', 'width=600,height=700');
  
  // 3. 콜백 대기
  window.addEventListener('message', async (event) => {
    if (event.data.type === 'oauth-success') {
      const { code } = event.data;
      
      // 4. 토큰 교환
      const { token, blogUrl } = await exchangeToken(platform, code);
      
      // 5. DB 저장
      await saveBlog(platform, blogUrl, token);
      
      toast.success('블로그 연동 완료!');
      popup?.close();
    }
  });
}
```

**워드프레스 연동 모달**
```jsx
<Modal isOpen={showWordPressModal}>
  <h3 className="text-xl font-bold mb-4">WordPress 연동</h3>
  
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-2">블로그 URL</label>
      <input
        type="url"
        placeholder="https://yourblog.com"
        className="w-full border rounded-lg px-4 py-3"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium mb-2">Application Password</label>
      <input
        type="password"
        className="w-full border rounded-lg px-4 py-3"
      />
      <a href="#" className="text-xs text-blue-500 mt-1 inline-block">
        Application Password 발급 방법 보기
      </a>
    </div>
    
    <Button variant="primary" fullWidth onClick={handleWordPressConnect}>
      연동하기
    </Button>
  </div>
</Modal>
```

---

## STEP 2: AI API 키 등록 (/onboarding/api-key)

### 레이아웃
```
┌────────────────────────────────────────┐
│  "AI API 키를 등록해주세요"             │
│  "본인 소유 API로 비용을 직접 관리"     │
│                                        │
│  [OpenAI] [Claude] [Gemini] [Grok]    │
│     ●                                  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  OpenAI API 키 입력               │  │
│  │  sk-...                           │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [API 키 검증하기]                     │
│                                        │
│  ✓ API 키 유효성 확인 완료             │
│  모델: gpt-4o                          │
└────────────────────────────────────────┘
```

### UI 컴포넌트
```jsx
<div className="space-y-6">
  {/* AI Provider 선택 */}
  <div>
    <label className="block text-sm font-medium mb-3">AI Provider 선택</label>
    <div className="grid grid-cols-4 gap-4">
      {['openai', 'claude', 'gemini', 'grok'].map(provider => (
        <button
          key={provider}
          onClick={() => setSelectedProvider(provider)}
          className={`
            p-4 border-2 rounded-lg text-center transition-all
            ${selectedProvider === provider 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'}
          `}
        >
          <img src={`/logos/${provider}.png`} className="h-8 mx-auto mb-2" />
          <span className="text-sm font-medium">{provider}</span>
        </button>
      ))}
    </div>
  </div>

  {/* API 키 입력 */}
  <div>
    <label className="block text-sm font-medium mb-2">
      {selectedProvider.toUpperCase()} API 키
    </label>
    <div className="relative">
      <input
        type={showApiKey ? 'text' : 'password'}
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="sk-..."
        className="w-full border rounded-lg px-4 py-3 pr-12 font-mono text-sm"
      />
      <button
        onClick={() => setShowApiKey(!showApiKey)}
        className="absolute right-3 top-3 text-gray-400"
      >
        {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
    <a 
      href={getApiKeyGuideUrl(selectedProvider)} 
      target="_blank"
      className="text-xs text-blue-500 mt-1 inline-block"
    >
      API 키 발급 방법 보기 →
    </a>
  </div>

  {/* 검증 버튼 */}
  <Button 
    variant="primary" 
    onClick={handleValidateApiKey}
    disabled={!apiKey || isValidating}
  >
    {isValidating ? '검증 중...' : 'API 키 검증하기'}
  </Button>

  {/* 검증 결과 */}
  {validationResult && (
    <div className={`
      p-4 rounded-lg flex items-start gap-3
      ${validationResult.success ? 'bg-green-50' : 'bg-red-50'}
    `}>
      {validationResult.success ? (
        <>
          <CheckCircle className="text-green-500 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">API 키 유효성 확인 완료</p>
            <p className="text-sm text-green-700 mt-1">
              모델: {validationResult.model}
            </p>
          </div>
        </>
      ) : (
        <>
          <XCircle className="text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">API 키 검증 실패</p>
            <p className="text-sm text-red-700 mt-1">
              {validationResult.error}
            </p>
          </div>
        </>
      )}
    </div>
  )}
</div>
```

### 기능 명세

**API 키 검증**
```typescript
async function handleValidateApiKey() {
  setIsValidating(true);
  
  try {
    // 각 Provider별 테스트 API 호출
    const response = await fetch('/api/keys/validate', {
      method: 'POST',
      body: JSON.stringify({
        provider: selectedProvider,
        apiKey,
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      // 암호화 후 DB 저장
      await saveApiKey(selectedProvider, apiKey);
      
      setValidationResult({
        success: true,
        model: result.model,
      });
    } else {
      setValidationResult({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    setValidationResult({
      success: false,
      error: '네트워크 에러가 발생했습니다.',
    });
  } finally {
    setIsValidating(false);
  }
}
```

---

## STEP 3: 카테고리 설정 (/onboarding/category)

### 레이아웃
```
┌────────────────────────────────────────┐
│  "블로그 주제를 선택해주세요"           │
│  "선택한 카테고리의 키워드만 수집"      │
│                                        │
│  [✓] 건강       [ ] IT                 │
│  [ ] 육아       [✓] 여행               │
│  [ ] 음식       [ ] 패션               │
│  [ ] 뷰티       [ ] 재테크             │
│  [ ] 부동산     [ ] 반려동물           │
│                                        │
│  선택된 카테고리: 2개                  │
└────────────────────────────────────────┘
```

### UI 컴포넌트
```jsx
<div className="space-y-6">
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {CATEGORIES.map(category => (
      <button
        key={category.id}
        onClick={() => toggleCategory(category.id)}
        className={`
          p-6 border-2 rounded-xl text-center transition-all
          ${selectedCategories.includes(category.id)
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'}
        `}
      >
        <div className="text-4xl mb-2">{category.icon}</div>
        <h3 className="font-semibold mb-1">{category.name}</h3>
        <p className="text-xs text-gray-500">{category.description}</p>
        
        {selectedCategories.includes(category.id) && (
          <CheckCircle className="text-blue-500 mx-auto mt-2" size={20} />
        )}
      </button>
    ))}
  </div>

  <div className="bg-blue-50 p-4 rounded-lg">
    <p className="text-sm text-blue-900">
      선택된 카테고리: <strong>{selectedCategories.length}개</strong>
    </p>
    <p className="text-xs text-blue-700 mt-1">
      선택한 카테고리의 인기 키워드만 자동 수집됩니다
    </p>
  </div>
</div>
```

### 카테고리 목록
```typescript
const CATEGORIES = [
  { id: 'health', name: '건강', icon: '💪', description: '운동, 다이어트, 웰빙' },
  { id: 'it', name: 'IT', icon: '💻', description: '기술, 개발, 가젯' },
  { id: 'parenting', name: '육아', icon: '👶', description: '출산, 육아 정보' },
  { id: 'travel', name: '여행', icon: '✈️', description: '국내외 여행' },
  { id: 'food', name: '음식', icon: '🍔', description: '맛집, 레시피' },
  { id: 'fashion', name: '패션', icon: '👗', description: '패션, 스타일' },
  { id: 'beauty', name: '뷰티', icon: '💄', description: '화장품, 스킨케어' },
  { id: 'finance', name: '재테크', icon: '💰', description: '투자, 재테크' },
  { id: 'realestate', name: '부동산', icon: '🏠', description: '부동산 정보' },
  { id: 'pets', name: '반려동물', icon: '🐕', description: '반려동물 케어' },
];
```

---

## STEP 4: 발행 시간 설정 (/onboarding/schedule)

### 레이아웃
```
┌────────────────────────────────────────┐
│  "자동 발행 시간을 설정해주세요"        │
│                                        │
│  발행 시간                              │
│  ┌──────┐ : ┌──────┐                   │
│  │  09  │   │  00  │                   │
│  └──────┘   └──────┘                   │
│                                        │
│  발행 요일                              │
│  [✓]월 [✓]화 [✓]수 [✓]목 [✓]금        │
│  [ ]토 [ ]일                           │
│                                        │
│  ───────────────────────────          │
│                                        │
│  미리보기:                             │
│  "매주 월~금 오전 9시에 자동 발행"     │
└────────────────────────────────────────┘
```

### UI 컴포넌트
```jsx
<div className="space-y-8">
  {/* 시간 선택 */}
  <div>
    <label className="block text-sm font-medium mb-3">발행 시간</label>
    <div className="flex items-center gap-3">
      <select 
        value={hour} 
        onChange={(e) => setHour(e.target.value)}
        className="border rounded-lg px-4 py-3 text-2xl font-bold"
      >
        {Array.from({ length: 24 }, (_, i) => (
          <option key={i} value={i.toString().padStart(2, '0')}>
            {i.toString().padStart(2, '0')}
          </option>
        ))}
      </select>
      <span className="text-2xl">:</span>
      <select 
        value={minute} 
        onChange={(e) => setMinute(e.target.value)}
        className="border rounded-lg px-4 py-3 text-2xl font-bold"
      >
        {['00', '15', '30', '45'].map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  </div>

  {/* 요일 선택 */}
  <div>
    <label className="block text-sm font-medium mb-3">발행 요일</label>
    <div className="flex gap-2">
      {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
        <button
          key={day}
          onClick={() => toggleDay(index)}
          className={`
            flex-1 py-3 rounded-lg font-semibold transition-all
            ${selectedDays.includes(index)
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
          `}
        >
          {day}
        </button>
      ))}
    </div>
  </div>

  {/* 미리보기 */}
  <div className="bg-blue-50 p-4 rounded-lg">
    <h4 className="text-sm font-semibold text-blue-900 mb-2">미리보기</h4>
    <p className="text-blue-700">
      {generateSchedulePreview(selectedDays, hour, minute)}
    </p>
  </div>

  {/* 완료 버튼 */}
  <Button 
    variant="primary" 
    size="lg" 
    fullWidth
    onClick={handleCompleteOnboarding}
  >
    설정 완료하고 시작하기 🎉
  </Button>
</div>
```

### 기능 명세

**스케줄 저장**
```typescript
async function handleCompleteOnboarding() {
  // 1. 스케줄 DB 저장
  await saveSchedule({
    userId,
    hour,
    minute,
    days: selectedDays,
  });
  
  // 2. 온보딩 완료 플래그
  await markOnboardingComplete(userId);
  
  // 3. 축하 토스트
  toast.success('🎉 모든 설정 완료! 첫 발행을 기다려보세요.');
  
  // 4. 대시보드로 이동
  router.push('/dashboard');
}
```

---

계속해서 대시보드와 설정 페이지를 작성할까요?


# 모라브(Morav) - 설정 & 결제 페이지 UI/UX 정의서

---

# ⚙️ 설정 페이지 구조

## 공통 레이아웃
```
┌────────────────────────────────────────┐
│  설정                                   │
├──────────┬─────────────────────────────┤
│          │                             │
│ 좌측     │       메인 콘텐츠            │
│ 탭 메뉴  │                             │
│          │                             │
│ 프로필   │                             │
│ 블로그   │                             │
│ API 키   │                             │
│ 구독     │                             │
│ 알림     │                             │
└──────────┴─────────────────────────────┘
```

---

# 📄 PAGE 10: 프로필 설정 (/settings/profile)

## 레이아웃
```
┌────────────────────────────────────────┐
│  프로필 설정                            │
│                                        │
│  ┌────────┐                            │
│  │  📷   │  [사진 변경]                │
│  │  ◯    │                             │
│  └────────┘                            │
│                                        │
│  이름                                  │
│  ┌──────────────────────────────────┐  │
│  │  홍길동                           │  │
│  └──────────────────────────────────┘  │
│                                        │
│  이메일                                │
│  ┌──────────────────────────────────┐  │
│  │  hong@example.com (변경 불가)     │  │
│  └──────────────────────────────────┘  │
│                                        │
│  비밀번호                              │
│  [비밀번호 변경]                       │
│                                        │
│  ───────────────────────────          │
│                                        │
│  계정 삭제                             │
│  [계정 삭제하기]                       │
│                                        │
│              [취소] [저장]             │
└────────────────────────────────────────┘
```

## UI 컴포넌트
```jsx
<div className="max-w-2xl">
  <h1 className="text-2xl font-bold mb-6">프로필 설정</h1>

  <form onSubmit={handleSaveProfile} className="space-y-8">
    {/* 프로필 사진 */}
    <div>
      <label className="block text-sm font-medium mb-3">프로필 사진</label>
      <div className="flex items-center gap-4">
        <Avatar size="xl" src={profile.avatar} />
        <div>
          <Button variant="outline" size="sm" onClick={handleUploadPhoto}>
            사진 변경
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG 파일 (최대 2MB)
          </p>
        </div>
      </div>
    </div>

    {/* 이름 */}
    <div>
      <label className="block text-sm font-medium mb-2">이름</label>
      <input
        type="text"
        value={profile.name}
        onChange={(e) => setProfile({...profile, name: e.target.value})}
        className="w-full border rounded-lg px-4 py-3"
      />
    </div>

    {/* 이메일 (읽기 전용) */}
    <div>
      <label className="block text-sm font-medium mb-2">이메일</label>
      <input
        type="email"
        value={profile.email}
        disabled
        className="w-full border rounded-lg px-4 py-3 bg-gray-50 text-gray-500"
      />
      <p className="text-xs text-gray-500 mt-1">
        이메일은 변경할 수 없습니다
      </p>
    </div>

    {/* 비밀번호 변경 */}
    <div>
      <label className="block text-sm font-medium mb-2">비밀번호</label>
      <Button 
        variant="outline" 
        type="button"
        onClick={() => setShowPasswordModal(true)}
      >
        비밀번호 변경
      </Button>
    </div>

    {/* 구분선 */}
    <div className="border-t pt-8">
      <h3 className="text-lg font-semibold text-red-600 mb-2">위험 영역</h3>
      <p className="text-sm text-gray-600 mb-4">
        계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
      </p>
      <Button 
        variant="outline" 
        className="text-red-600 border-red-600 hover:bg-red-50"
        onClick={() => setShowDeleteModal(true)}
      >
        계정 삭제하기
      </Button>
    </div>

    {/* 저장 버튼 */}
    <div className="flex justify-end gap-3">
      <Button variant="outline" type="button" onClick={handleCancel}>
        취소
      </Button>
      <Button variant="primary" type="submit">
        저장
      </Button>
    </div>
  </form>
</div>

{/* 비밀번호 변경 모달 */}
<Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
  <h3 className="text-xl font-bold mb-4">비밀번호 변경</h3>
  
  <form onSubmit={handleChangePassword} className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-2">현재 비밀번호</label>
      <input
        type="password"
        className="w-full border rounded-lg px-4 py-3"
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">새 비밀번호</label>
      <input
        type="password"
        minLength={8}
        className="w-full border rounded-lg px-4 py-3"
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">새 비밀번호 확인</label>
      <input
        type="password"
        className="w-full border rounded-lg px-4 py-3"
      />
    </div>

    <div className="flex justify-end gap-3 pt-4">
      <Button variant="outline" type="button" onClick={() => setShowPasswordModal(false)}>
        취소
      </Button>
      <Button variant="primary" type="submit">
        변경
      </Button>
    </div>
  </form>
</Modal>
```

---

# 📄 PAGE 11: 블로그 관리 (/settings/blogs)

## 레이아웃
```
┌────────────────────────────────────────┐
│  블로그 관리                            │
│  "최대 3개까지 연동 가능"               │
│                                        │
│  연동된 블로그 (2/3)                    │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ [T] myblog.tistory.com           │  │
│  │ 카테고리: 건강, IT                │  │
│  │ 발행 건수: 150건                  │  │
│  │            [수정] [연동 해제]     │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ [G] myblog2.blogspot.com         │  │
│  │ 카테고리: 여행                    │  │
│  │ 발행 건수: 80건                   │  │
│  │            [수정] [연동 해제]     │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [+ 새 블로그 추가]                    │
└────────────────────────────────────────┘
```

## UI 컴포넌트
```jsx
<div className="max-w-3xl">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold">블로그 관리</h1>
      <p className="text-gray-500 mt-1">
        연동된 블로그: {connectedBlogs.length}/3
      </p>
    </div>
    
    {connectedBlogs.length < 3 && (
      <Button variant="primary" onClick={() => setShowAddBlogModal(true)}>
        <Plus size={16} />
        블로그 추가
      </Button>
    )}
  </div>

  {/* 블로그 리스트 */}
  <div className="space-y-4">
    {connectedBlogs.map(blog => (
      <Card key={blog.id} className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* 플랫폼 아이콘 */}
            <div className="p-3 bg-gray-100 rounded-lg">
              <BlogIcon platform={blog.platform} size={24} />
            </div>

            {/* 블로그 정보 */}
            <div>
              <h3 className="font-semibold mb-1">{blog.url}</h3>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Tag size={14} />
                  {blog.categories.join(', ')}
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={14} />
                  {blog.postCount}건 발행
                </span>
              </div>

              {/* 상태 */}
              <Badge variant={blog.isActive ? 'success' : 'error'}>
                {blog.isActive ? '활성화' : '비활성화'}
              </Badge>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEditBlog(blog.id)}
            >
              수정
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-600 border-red-600"
              onClick={() => handleDisconnectBlog(blog.id)}
            >
              연동 해제
            </Button>
          </div>
        </div>
      </Card>
    ))}
  </div>

  {/* 빈 상태 */}
  {connectedBlogs.length === 0 && (
    <Card className="p-12 text-center">
      <div className="text-gray-400 mb-4">
        <Globe size={48} className="mx-auto" />
      </div>
      <h3 className="text-lg font-semibold mb-2">연동된 블로그가 없습니다</h3>
      <p className="text-gray-500 mb-6">
        블로그를 추가하고 자동 발행을 시작하세요
      </p>
      <Button variant="primary" onClick={() => setShowAddBlogModal(true)}>
        블로그 추가하기
      </Button>
    </Card>
  )}
</div>
```

---

# 📄 PAGE 12: API 키 관리 (/settings/api-keys)

## 레이아웃
```
┌────────────────────────────────────────┐
│  AI API 키 관리                         │
│                                        │
│  등록된 API 키 (1)                      │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ [OpenAI Logo]                    │  │
│  │ OpenAI GPT-4o                    │  │
│  │ sk-...6789 (끝 4자리)             │  │
│  │ 등록일: 2026-01-05                │  │
│  │            [재검증] [삭제]        │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [+ 새 API 키 추가]                    │
└────────────────────────────────────────┘
```

## UI 컴포넌트
```jsx
<div className="max-w-3xl">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold">AI API 키 관리</h1>
      <p className="text-gray-500 mt-1">
        등록된 API 키: {apiKeys.length}개
      </p>
    </div>
    
    <Button variant="primary" onClick={() => setShowAddKeyModal(true)}>
      <Plus size={16} />
      API 키 추가
    </Button>
  </div>

  {/* API 키 리스트 */}
  <div className="space-y-4">
    {apiKeys.map(key => (
      <Card key={key.id} className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Provider 아이콘 */}
            <div className="p-3 bg-gray-100 rounded-lg">
              <img 
                src={`/logos/${key.provider}.png`} 
                alt={key.provider}
                className="w-8 h-8"
              />
            </div>

            {/* API 키 정보 */}
            <div>
              <h3 className="font-semibold mb-1">
                {key.provider.toUpperCase()} {key.model}
              </h3>
              
              <div className="flex items-center gap-2 mb-2">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                  {key.maskedKey}
                </code>
                <button 
                  onClick={() => handleCopyKey(key.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy size={14} />
                </button>
              </div>

              <p className="text-xs text-gray-500">
                등록일: {formatDate(key.createdAt)}
              </p>

              {/* 검증 상태 */}
              {key.lastValidated && (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-xs text-green-600">
                    마지막 검증: {formatTimeAgo(key.lastValidated)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleRevalidateKey(key.id)}
            >
              재검증
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-600 border-red-600"
              onClick={() => handleDeleteKey(key.id)}
            >
              삭제
            </Button>
          </div>
        </div>
      </Card>
    ))}
  </div>

  {/* 보안 안내 */}
  <Card className="p-6 bg-blue-50 border-blue-200 mt-6">
    <div className="flex gap-3">
      <Shield className="text-blue-500 flex-shrink-0" />
      <div>
        <h4 className="font-semibold text-blue-900 mb-1">보안 안내</h4>
        <p className="text-sm text-blue-700">
          API 키는 AES-256으로 암호화되어 안전하게 저장됩니다. 
          모라브는 귀하의 API 키를 절대 다른 용도로 사용하지 않습니다.
        </p>
      </div>
    </div>
  </Card>
</div>
```

---

# 📄 PAGE 13: 구독 플랜 (/settings/subscription)

## 레이아웃
```
┌────────────────────────────────────────┐
│  구독 플랜                              │
│                                        │
│  현재 플랜: 스탠다드                    │
│  ┌──────────────────────────────────┐  │
│  │ 월 ₩39,000                        │  │
│  │ 200건/월 · 2개 블로그              │  │
│  │ 다음 결제일: 2026-02-01            │  │
│  └──────────────────────────────────┘  │
│                                        │
│  사용 현황                             │
│  ┌──────────────────────────────────┐  │
│  │ [■■■■■■■□□□] 75%              │  │
│  │ 150 / 200건 사용                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [플랜 변경] [결제 내역]                │
└────────────────────────────────────────┘
```

## UI 컴포넌트
```jsx
<div className="max-w-4xl">
  <h1 className="text-2xl font-bold mb-6">구독 플랜</h1>

  {/* 현재 플랜 */}
  <Card className="p-8 mb-6">
    <div className="flex items-start justify-between mb-6">
      <div>
        <Badge variant="primary" className="mb-2">현재 플랜</Badge>
        <h2 className="text-3xl font-bold mb-2">{subscription.plan}</h2>
        <p className="text-gray-500">
          월 ₩{subscription.price.toLocaleString()}
        </p>
      </div>
      
      <div className="text-right">
        <p className="text-sm text-gray-500 mb-1">다음 결제일</p>
        <p className="font-semibold">{formatDate(subscription.nextBillingDate)}</p>
      </div>
    </div>

    {/* 플랜 상세 */}
    <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b">
      <div>
        <p className="text-sm text-gray-500 mb-1">월 발행 한도</p>
        <p className="text-xl font-bold">{subscription.monthlyLimit}건</p>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">연동 가능 블로그</p>
        <p className="text-xl font-bold">{subscription.blogLimit}개</p>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">모든 기능</p>
        <p className="text-xl font-bold">✓ 포함</p>
      </div>
    </div>

    {/* 사용 현황 */}
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">이번 달 사용량</h3>
        <span className="text-sm text-gray-500">
          {subscription.usedCount} / {subscription.monthlyLimit}건
        </span>
      </div>
      <ProgressBar 
        value={(subscription.usedCount / subscription.monthlyLimit) * 100} 
      />
      <p className="text-xs text-gray-500 mt-2">
        {subscription.monthlyLimit - subscription.usedCount}건 남음 · 
        {formatDate(subscription.resetDate)}에 초기화
      </p>
    </div>

    {/* 액션 버튼 */}
    <div className="flex gap-3">
      <Button variant="primary" onClick={() => router.push('/payment/plans')}>
        플랜 변경
      </Button>
      <Button variant="outline" onClick={() => setShowBillingHistoryModal(true)}>
        결제 내역
      </Button>
      <Button variant="outline" onClick={() => setShowCancelModal(true)}>
        구독 취소
      </Button>
    </div>
  </Card>

  {/* 플랜 비교 */}
  <div>
    <h2 className="text-xl font-bold mb-4">다른 플랜 보기</h2>
    <PricingTable currentPlan={subscription.plan} />
  </div>
</div>
```

---

# 📄 PAGE 14: 알림 설정 (/settings/notifications)

## 레이아웃
```
┌────────────────────────────────────────┐
│  알림 설정                              │
│                                        │
│  이메일 알림                            │
│  [✓] 발행 완료 알림                     │
│  [✓] 발행 실패 알림                     │
│  [ ] 주간 리포트                        │
│  [ ] 마케팅 소식                        │
│                                        │
│  앱 푸시 알림                           │
│  [✓] 발행 완료                          │
│  [ ] 새 기능 업데이트                   │
│                                        │
│              [취소] [저장]             │
└────────────────────────────────────────┘
```

## UI 컴포넌트
```jsx
<div className="max-w-2xl">
  <h1 className="text-2xl font-bold mb-6">알림 설정</h1>

  <form onSubmit={handleSaveNotifications} className="space-y-8">
    {/* 이메일 알림 */}
    <div>
      <h3 className="font-semibold mb-4">이메일 알림</h3>
      <div className="space-y-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={notifications.email.publishSuccess}
            onChange={(e) => handleToggle('email', 'publishSuccess', e.target.checked)}
            className="mt-1"
          />
          <div>
            <p className="font-medium">발행 완료 알림</p>
            <p className="text-sm text-gray-500">
              콘텐츠가 성공적으로 발행되면 이메일을 받습니다
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={notifications.email.publishFailed}
            onChange={(e) => handleToggle('email', 'publishFailed', e.target.checked)}
            className="mt-1"
          />
          <div>
            <p className="font-medium">발행 실패 알림</p>
            <p className="text-sm text-gray-500">
              발행에 실패하면 즉시 이메일을 받습니다
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={notifications.email.weeklyReport}
            onChange={(e) => handleToggle('email', 'weeklyReport', e.target.checked)}
            className="mt-1"
          />
          <div>
            <p className="font-medium">주간 리포트</p>
            <p className="text-sm text-gray-500">
              매주 월요일 지난주 통계를 이메일로 받습니다
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={notifications.email.marketing}
            onChange={(e) => handleToggle('email', 'marketing', e.target.checked)}
            className="mt-1"
          />
          <div>
            <p className="font-medium">마케팅 소식</p>
            <p className="text-sm text-gray-500">
              신규 기능, 프로모션 등의 소식을 받습니다
            </p>
          </div>
        </label>
      </div>
    </div>

    {/* 앱 푸시 알림 */}
    <div className="border-t pt-8">
      <h3 className="font-semibold mb-4">앱 푸시 알림</h3>
      <div className="space-y-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={notifications.push.publishSuccess}
            onChange={(e) => handleToggle('push', 'publishSuccess', e.target.checked)}
            className="mt-1"
          />
          <div>
            <p className="font-medium">발행 완료</p>
            <p className="text-sm text-gray-500">
              모바일 앱에서 푸시 알림을 받습니다
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={notifications.push.newFeatures}
            onChange={(e) => handleToggle('push', 'newFeatures', e.target.checked)}
            className="mt-1"
          />
          <div>
            <p className="font-medium">새 기능 업데이트</p>
            <p className="text-sm text-gray-500">
              모라브의 새 기능이 출시되면 알림을 받습니다
            </p>
          </div>
        </label>
      </div>
    </div>

    {/* 저장 버튼 */}
    <div className="flex justify-end gap-3 pt-6 border-t">
      <Button variant="outline" type="button" onClick={handleCancel}>
        취소
      </Button>
      <Button variant="primary" type="submit">
        저장
      </Button>
    </div>
  </form>
</div>
```

---

# 💳 결제 페이지

---

# 📄 PAGE 15: 플랜 선택 (/payment/plans)

## 레이아웃
```
┌────────────────────────────────────────┐
│  플랜 선택                              │
│  "사용량에 맞는 플랜을 선택하세요"      │
│                                        │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │무료│ │라이│ │스탠│ │프로│          │
│  │체험│ │ 트│ │다드│ │   │          │
│  │    │ │💎  │ │    │ │    │          │
│  └────┘ └────┘ └────┘ └────┘          │
│                                        │
│  블로그 수 선택                         │
│  ( ) 1개  (●) 2개  ( ) 3개             │
│                                        │
│  선택한 플랜: 스탠다드 (2개 블로그)     │
│  월 ₩59,000                            │
│                                        │
│  [결제하기]                             │
└────────────────────────────────────────┘
```

## UI 컴포넌트
```jsx
<div className="max-w-7xl mx-auto">
  <div className="text-center mb-12">
    <h1 className="text-4xl font-bold mb-4">플랜 선택</h1>
    <p className="text-xl text-gray-600">
      사용량에 맞는 플랜을 선택하세요
    </p>
  </div>

  {/* 플랜 카드 */}
  <div className="grid grid-cols-4 gap-6 mb-8">
    {PLANS.map(plan => (
      <Card
        key={plan.id}
        className={`p-6 cursor-pointer transition-all ${
          selectedPlan === plan.id
            ? 'border-2 border-blue-500 shadow-xl'
            : 'hover:shadow-lg'
        }`}
        onClick={() => setSelectedPlan(plan.id)}
      >
        {plan.badge && (
          <Badge variant="primary" className="mb-4">
            {plan.badge}
          </Badge>
        )}

        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
        
        <div className="mb-4">
          <div className="text-4xl font-bold">
            {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}`}
          </div>
          {plan.price > 0 && (
            <p className="text-gray-500">/월</p>
          )}
        </div>

        <ul className="space-y-3 mb-6">
          <li className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="text-green-500" />
            {plan.posts}건 발행
          </li>
          <li className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="text-green-500" />
            {plan.blogLimit}개 블로그
          </li>
          <li className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="text-green-500" />
            모든 기능 포함
          </li>
        </ul>

        <Button
          variant={selectedPlan === plan.id ? 'primary' : 'outline'}
          fullWidth
        >
          {selectedPlan === plan.id ? '선택됨' : '선택하기'}
        </Button>
      </Card>
    ))}
  </div>

  {/* 블로그 수 선택 */}
  {selectedPlan !== 'free' && (
    <Card className="p-6 mb-8">
      <h3 className="font-semibold mb-4">블로그 수 선택</h3>
      <div className="flex gap-4">
        {[1, 2, 3].map(count => (
          <button
            key={count}
            onClick={() => setBlogCount(count)}
            className={`
              flex-1 p-4 border-2 rounded-lg text-center transition-all
              ${blogCount === count
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            <p className="text-2xl font-bold mb-1">{count}개</p>
            <p className="text-sm text-gray-500">
              ₩{calculatePrice(selectedPlan, count).toLocaleString()}/월
            </p>
          </button>
        ))}
      </div>
    </Card>
  )}

  {/* 결제 요약 */}
  <Card className="p-8 bg-gray-50">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">
          {PLANS.find(p => p.id === selectedPlan)?.name}
        </h3>
        <p className="text-gray-500">
          {blogCount}개 블로그 · 월 {PLANS.find(p => p.id === selectedPlan)?.posts}건
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500 mb-1">월 결제 금액</p>
        <p className="text-3xl font-bold">
          ₩{calculatePrice(selectedPlan, blogCount).toLocaleString()}
        </p>
      </div>
    </div>

    <Button
      variant="primary"
      size="lg"
      fullWidth
      onClick={handleCheckout}
    >
      결제하기
    </Button>

    <p className="text-xs text-gray-500 text-center mt-4">
      7일 이내 100% 환불 보장 · 언제든지 취소 가능
    </p>
  </Card>
</div>
```

---

# 📄 PAGE 16: 결제 진행 (/payment/checkout)

## 레이아웃 (토스페이먼츠 위젯)
```
┌────────────────────────────────────────┐
│  결제하기                               │
│                                        │
│  주문 정보                             │
│  스탠다드 플랜 (2개 블로그)             │
│  ₩59,000                               │
│                                        │
│  ───────────────────────────          │
│                                        │
│  [토스페이먼츠 결제 위젯]               │
│                                        │
│  [결제하기]                             │
└────────────────────────────────────────┘
```

## UI 컴포넌트
```jsx
<div className="max-w-2xl mx-auto">
  <h1 className="text-2xl font-bold mb-6">결제하기</h1>

  {/* 주문 정보 */}
  <Card className="p-6 mb-6">
    <h3 className="font-semibold mb-4">주문 정보</h3>
    <div className="flex items-center justify-between py-3 border-b">
      <div>
        <p className="font-medium">{order.planName}</p>
        <p className="text-sm text-gray-500">{order.description}</p>
      </div>
      <p className="font-bold">₩{order.amount.toLocaleString()}</p>
    </div>
    <div className="flex items-center justify-between py-3">
      <p className="font-semibold">총 결제 금액</p>
      <p className="text-2xl font-bold text-blue-500">
        ₩{order.amount.toLocaleString()}
      </p>
    </div>
  </Card>

  {/* 토스페이먼츠 위젯 */}
  <Card className="p-6 mb-6">
    <div id="payment-widget"></div>
  </Card>

  {/* 약관 동의 */}
  <Card className="p-6 mb-6">
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={agreedToTerms}
        onChange={(e) => setAgreedToTerms(e.target.checked)}
        className="mt-1"
      />
      <p className="text-sm">
        <a href="/terms" className="text-blue-500 underline">이용약관</a> 및{' '}
        <a href="/privacy" className="text-blue-500 underline">개인정보처리방침</a>에 
        동의합니다 (필수)
      </p>
    </label>
  </Card>

  {/* 결제 버튼 */}
  <Button
    variant="primary"
    size="lg"
    fullWidth
    disabled={!agreedToTerms}
    onClick={handlePayment}
  >
    ₩{order.amount.toLocaleString()} 결제하기
  </Button>

  <p className="text-xs text-gray-500 text-center mt-4">
    안전한 결제를 위해 SSL 보안 연결을 사용합니다
  </p>
</div>
```

### 기능 명세

**토스페이먼츠 연동**
```typescript
useEffect(() => {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
  
  const paymentWidget = PaymentWidget(clientKey, customerKey);
  
  paymentWidget.renderPaymentMethods('#payment-widget', {
    value: order.amount,
  });
  
  setPaymentWidget(paymentWidget);
}, []);

async function handlePayment() {
  try {
    await paymentWidget.requestPayment({
      orderId: order.id,
      orderName: order.planName,
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`,
    });
  } catch (error) {
    toast.error('결제에 실패했습니다.');
  }
}
```

---

# 📄 PAGE 17: 결제 완료 (/payment/success)

## 레이아웃
```
┌────────────────────────────────────────┐
│                                        │
│           ✓                            │
│      결제 완료!                         │
│                                        │
│  스탠다드 플랜 구독이 시작되었습니다     │
│                                        │
│  주문 번호: #12345                      │
│  결제 금액: ₩59,000                     │
│  다음 결제일: 2026-02-01                │
│                                        │
│  [대시보드로 이동]                      │
└────────────────────────────────────────┘
```

## UI 컴포넌트
```jsx
<div className="max-w-2xl mx-auto text-center py-12">
  {/* 성공 아이콘 */}
  <div className="mb-6">
    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
      <CheckCircle size={48} className="text-green-500" />
    </div>
  </div>

  {/* 메시지 */}
  <h1 className="text-3xl font-bold mb-4">결제 완료!</h1>
  <p className="text-xl text-gray-600 mb-8">
    {order.planName} 구독이 시작되었습니다
  </p>

  {/* 결제 정보 */}
  <Card className="p-8 mb-8">
    <div className="space-y-3 text-left">
      <div className="flex justify-between">
        <span className="text-gray-500">주문 번호</span>
        <span className="font-semibold">{order.id}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">결제 금액</span>
        <span className="font-semibold">₩{order.amount.toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">다음 결제일</span>
        <span className="font-semibold">{formatDate(order.nextBillingDate)}</span>
      </div>
    </div>
  </Card>

  {/* CTA */}
  <div className="space-y-3">
    <Button
      variant="primary"
      size="lg"
      fullWidth
      onClick={() => router.push('/dashboard')}
    >
      대시보드로 이동
    </Button>
    
    <Button
      variant="outline"
      fullWidth
      onClick={() => router.push('/settings/subscription')}
    >
      구독 관리
    </Button>
  </div>
</div>
```

---

## ✅ 전체 페이지 요약

| 페이지 | 경로 | 주요 기능 |
|--------|------|----------|
| 1. 랜딩 | `/` | 서비스 소개, 무료 시작 |
| 2. 로그인 | `/auth/login` | 이메일/소셜 로그인 |
| 3. 회원가입 | `/auth/signup` | 계정 생성, 약관 동의 |
| 4-7. 온보딩 | `/onboarding/*` | 블로그 연동, API 키, 카테고리, 스케줄 |
| 8. 대시보드 | `/dashboard` | 발행 현황, 통계, 빠른 작업 |
| 9. 발행 관리 | `/dashboard/posts` | 전체 발행 목록, 필터링 |
| 10. 키워드 탐색 | `/dashboard/keywords` | 트렌드 키워드, 즉시 생성 |
| 11. 프로필 | `/settings/profile` | 개인정보 수정 |
| 12. 블로그 관리 | `/settings/blogs` | 블로그 추가/제거 |
| 13. API 키 | `/settings/api-keys` | API 키 관리 |
| 14. 구독 | `/settings/subscription` | 플랜 관리, 사용량 |
| 15. 알림 | `/settings/notifications` | 알림 설정 |
| 16. 플랜 선택 | `/payment/plans` | 요금제 비교 |
| 17. 결제 | `/payment/checkout` | 토스페이먼츠 결제 |
| 18. 결제 완료 | `/payment/success` | 결제 확인 |

---

## 🎨 디자인 일관성 체크리스트

- [ ] 모든 페이지에서 동일한 색상 팔레트 사용
- [ ] 동일한 타이포그래피 스케일 적용
- [ ] 통일된 간격 시스템 (4px 단위)
- [ ] 공통 컴포넌트 재사용 (Button, Card, Badge 등)
- [ ] 반응형 브레이크포인트 일관성
- [ ] 로딩 상태 및 에러 처리 UI 통일

**이제 모든 페이지 정의가 완료되었습니다!** 🎉

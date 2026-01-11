# 모라브(Morav) - 대시보드 & 설정 페이지 UI/UX 정의서

## 📊 대시보드 구조

---

# 📄 PAGE 7: 메인 대시보드 (/dashboard)

## 목적
- 발행 현황 실시간 모니터링
- 주요 지표 한눈에 확인
- 빠른 액션 실행

## 레이아웃 (3단 구조)
```
┌──────┬─────────────────────────────┬──────────┐
│      │                             │          │
│ 좌측 │       메인 콘텐츠 영역        │  우측    │
│ 네비 │                             │  위젯    │
│      │                             │          │
│ 200px│         1000px              │  300px   │
└──────┴─────────────────────────────┴──────────┘
```

## 전체 레이아웃 상세
```
┌────────────────────────────────────────────────────┐
│  [로고]  모라브                    [👤] [🔔] [⚙️]  │ ← 상단 네비
├────┬───────────────────────────────────────┬───────┤
│    │                                       │       │
│ 📊 │  오늘의 발행 현황                      │  💎   │
│ 대시│  ┌─────┬─────┬─────┬─────┐           │ 플랜  │
│ 보드│  │ 50  │ 48  │ 2   │96% │           │      │
│    │  │발행 │성공 │실패 │성공률│           │스탠다드│
│ 📝 │  └─────┴─────┴─────┴─────┘           │      │
│ 발행│                                       │ 200건중│
│ 관리│  최근 발행 목록                       │ 150건 │
│    │  ┌─────────────────────────┐          │ 사용  │
│ 🔍 │  │ #건강 키워드로 발행...   │          │      │
│ 키워│  │ myblog.tistory.com      │          │ ───  │
│ 드  │  │ ✓ 발행 완료  5분 전      │          │      │
│    │  └─────────────────────────┘          │  📈  │
│ ⚙️ │  ┌─────────────────────────┐          │ 통계  │
│ 설정│  │ #IT 최신 트렌드...       │          │      │
│    │  │ myblog2.tistory.com     │          │ 이번 주│
│ 💳 │  │ ⏳ 예약 대기  2시간 후   │          │ +45% │
│ 결제│  └─────────────────────────┘          │ 증가  │
└────┴───────────────────────────────────────┴───────┘
```

## 좌측 네비게이션
```jsx
<nav className="w-64 bg-white border-r h-screen fixed">
  {/* 로고 */}
  <div className="p-6">
    <Logo />
  </div>

  {/* 메뉴 */}
  <div className="space-y-1 px-3">
    <NavItem icon={<LayoutDashboard />} href="/dashboard" active>
      대시보드
    </NavItem>
    <NavItem icon={<FileText />} href="/dashboard/posts">
      발행 관리
    </NavItem>
    <NavItem icon={<TrendingUp />} href="/dashboard/keywords">
      키워드 탐색
    </NavItem>
    <NavItem icon={<BarChart />} href="/dashboard/analytics">
      분석 리포트
    </NavItem>
    
    <div className="border-t my-4"></div>
    
    <NavItem icon={<Settings />} href="/settings">
      설정
    </NavItem>
    <NavItem icon={<CreditCard />} href="/payment/plans">
      요금제
    </NavItem>
  </div>

  {/* 하단 사용자 정보 */}
  <div className="absolute bottom-0 w-full p-4 border-t">
    <div className="flex items-center gap-3">
      <Avatar src={user.avatar} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>
      <button className="text-gray-400 hover:text-gray-600">
        <LogOut size={18} />
      </button>
    </div>
  </div>
</nav>
```

## 메인 콘텐츠 영역

### 1. 오늘의 발행 현황 (상단 메트릭 카드)
```jsx
<div className="grid grid-cols-4 gap-6 mb-8">
  {/* 총 발행 건수 */}
  <MetricCard
    icon={<FileText className="text-blue-500" />}
    title="오늘 발행"
    value="50"
    suffix="건"
    trend={{ value: 12, direction: 'up' }}
  />

  {/* 성공 */}
  <MetricCard
    icon={<CheckCircle className="text-green-500" />}
    title="발행 성공"
    value="48"
    suffix="건"
    percentage={96}
  />

  {/* 실패 */}
  <MetricCard
    icon={<XCircle className="text-red-500" />}
    title="발행 실패"
    value="2"
    suffix="건"
    trend={{ value: 50, direction: 'down' }}
  />

  {/* 성공률 */}
  <MetricCard
    icon={<TrendingUp className="text-purple-500" />}
    title="성공률"
    value="96"
    suffix="%"
    isPercentage
  />
</div>
```

**MetricCard 컴포넌트**
```jsx
function MetricCard({ icon, title, value, suffix, trend, percentage }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          {icon}
        </div>
        {trend && (
          <Badge variant={trend.direction === 'up' ? 'success' : 'error'}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
          </Badge>
        )}
      </div>
      
      <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-gray-500">{suffix}</span>
      </div>
      
      {percentage && (
        <div className="mt-3">
          <ProgressBar value={percentage} />
        </div>
      )}
    </Card>
  );
}
```

### 2. 최근 발행 목록
```jsx
<Card className="mb-8">
  <div className="p-6 border-b flex items-center justify-between">
    <h2 className="text-xl font-bold">최근 발행 목록</h2>
    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/posts')}>
      전체 보기
    </Button>
  </div>

  <div className="divide-y">
    {recentPosts.map(post => (
      <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{post.keyword}</Badge>
              <span className="text-xs text-gray-500">
                {post.blog.platform} · {post.blog.name}
              </span>
            </div>
            
            <h3 className="font-semibold mb-1 line-clamp-1">
              {post.title}
            </h3>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {post.content}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{formatTimeAgo(post.publishedAt)}</span>
              <a 
                href={post.url} 
                target="_blank"
                className="text-blue-500 hover:underline"
              >
                블로그에서 보기 →
              </a>
            </div>
          </div>
          
          <div className="ml-4">
            <StatusBadge status={post.status} />
          </div>
        </div>
      </div>
    ))}
  </div>
</Card>
```

**StatusBadge 컴포넌트**
```jsx
function StatusBadge({ status }) {
  const variants = {
    published: { label: '발행 완료', color: 'green' },
    scheduled: { label: '예약 대기', color: 'orange' },
    failed: { label: '발행 실패', color: 'red' },
    generating: { label: '생성 중', color: 'blue' },
  };
  
  const { label, color } = variants[status];
  
  return (
    <Badge variant={color} className="flex items-center gap-2">
      {status === 'published' && <CheckCircle size={14} />}
      {status === 'scheduled' && <Clock size={14} />}
      {status === 'failed' && <XCircle size={14} />}
      {status === 'generating' && <Loader size={14} className="animate-spin" />}
      {label}
    </Badge>
  );
}
```

### 3. 인기 키워드 미리보기
```jsx
<Card>
  <div className="p-6 border-b">
    <h2 className="text-xl font-bold">실시간 인기 키워드</h2>
    <p className="text-sm text-gray-500 mt-1">
      선택한 카테고리의 트렌드 키워드
    </p>
  </div>

  <div className="p-6">
    <div className="space-y-3">
      {trendingKeywords.map((keyword, index) => (
        <div 
          key={keyword.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
          onClick={() => handleKeywordClick(keyword)}
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-gray-300">
              #{index + 1}
            </span>
            <div>
              <h4 className="font-semibold">{keyword.keyword}</h4>
              <p className="text-xs text-gray-500">
                {keyword.category} · {keyword.trendingScore} 검색
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendBadge trend={keyword.trend} />
            <Button variant="ghost" size="sm">
              <Sparkles size={16} />
              생성하기
            </Button>
          </div>
        </div>
      ))}
    </div>
  </div>
</Card>
```

## 우측 위젯 영역

### 1. 구독 플랜 위젯
```jsx
<Card className="mb-6">
  <div className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold">현재 플랜</h3>
      <Badge variant="primary">스탠다드</Badge>
    </div>
    
    <div className="mb-4">
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold">150</span>
        <span className="text-gray-500">/ 200건</span>
      </div>
      <ProgressBar value={75} />
    </div>
    
    <p className="text-xs text-gray-500 mb-4">
      이번 달 50건 남음 · 1월 31일 갱신
    </p>
    
    <Button variant="outline" size="sm" fullWidth>
      플랜 업그레이드
    </Button>
  </div>
</Card>
```

### 2. 주간 통계 위젯
```jsx
<Card className="mb-6">
  <div className="p-6">
    <h3 className="font-semibold mb-4">이번 주 통계</h3>
    
    <div className="space-y-4">
      <StatItem
        icon={<FileText className="text-blue-500" />}
        label="발행 건수"
        value="28건"
        trend="+12%"
      />
      
      <StatItem
        icon={<Eye className="text-green-500" />}
        label="평균 조회수"
        value="1,234"
        trend="+45%"
      />
      
      <StatItem
        icon={<CheckCircle className="text-purple-500" />}
        label="성공률"
        value="98.5%"
        trend="+2.5%"
      />
    </div>
  </div>
</Card>
```

### 3. 빠른 작업 위젯
```jsx
<Card>
  <div className="p-6">
    <h3 className="font-semibold mb-4">빠른 작업</h3>
    
    <div className="space-y-3">
      <Button variant="primary" fullWidth onClick={handleManualPublish}>
        <Zap size={16} />
        지금 발행하기
      </Button>
      
      <Button variant="outline" fullWidth onClick={() => router.push('/settings/blogs')}>
        <Plus size={16} />
        블로그 추가
      </Button>
      
      <Button variant="outline" fullWidth onClick={() => router.push('/settings/schedule')}>
        <Calendar size={16} />
        스케줄 변경
      </Button>
    </div>
  </div>
</Card>
```

---

# 📄 PAGE 8: 발행 관리 (/dashboard/posts)

## 목적
- 모든 발행 기록 조회
- 필터링 및 검색
- 상태별 관리

## 레이아웃
```
┌────────────────────────────────────────┐
│  발행 관리                              │
│                                        │
│  [검색]  [블로그▼] [상태▼] [기간▼]    │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ 발행 목록 테이블                  │  │
│  │ ┌────┬──────┬────┬────┬────┐    │  │
│  │ │제목│블로그│상태│시간│액션│    │  │
│  │ ├────┼──────┼────┼────┼────┤    │  │
│  │ │... │...   │... │... │... │    │  │
│  │ └────┴──────┴────┴────┴────┘    │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [1] [2] [3] ... [10]    페이지네이션 │
└────────────────────────────────────────┘
```

## UI 컴포넌트

### 필터 바
```jsx
<div className="flex items-center gap-4 mb-6">
  {/* 검색 */}
  <div className="flex-1 relative">
    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
    <input
      type="text"
      placeholder="제목, 키워드로 검색..."
      className="w-full pl-10 pr-4 py-3 border rounded-lg"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  </div>

  {/* 블로그 필터 */}
  <Select value={blogFilter} onChange={setBlogFilter}>
    <option value="all">모든 블로그</option>
    {blogs.map(blog => (
      <option key={blog.id} value={blog.id}>{blog.name}</option>
    ))}
  </Select>

  {/* 상태 필터 */}
  <Select value={statusFilter} onChange={setStatusFilter}>
    <option value="all">모든 상태</option>
    <option value="published">발행 완료</option>
    <option value="scheduled">예약 대기</option>
    <option value="failed">발행 실패</option>
  </Select>

  {/* 기간 필터 */}
  <Select value={dateFilter} onChange={setDateFilter}>
    <option value="today">오늘</option>
    <option value="week">이번 주</option>
    <option value="month">이번 달</option>
    <option value="all">전체</option>
  </Select>
</div>
```

### 발행 목록 테이블
```jsx
<Card>
  <table className="w-full">
    <thead className="bg-gray-50 border-b">
      <tr>
        <th className="px-6 py-4 text-left text-sm font-semibold">제목</th>
        <th className="px-6 py-4 text-left text-sm font-semibold">블로그</th>
        <th className="px-6 py-4 text-left text-sm font-semibold">키워드</th>
        <th className="px-6 py-4 text-left text-sm font-semibold">상태</th>
        <th className="px-6 py-4 text-left text-sm font-semibold">시간</th>
        <th className="px-6 py-4 text-left text-sm font-semibold">액션</th>
      </tr>
    </thead>
    
    <tbody className="divide-y">
      {posts.map(post => (
        <tr key={post.id} className="hover:bg-gray-50">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-gray-400" />
              <div>
                <p className="font-medium line-clamp-1">{post.title}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{post.excerpt}</p>
              </div>
            </div>
          </td>
          
          <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              <BlogIcon platform={post.blog.platform} />
              <span className="text-sm">{post.blog.name}</span>
            </div>
          </td>
          
          <td className="px-6 py-4">
            <Badge variant="outline">{post.keyword}</Badge>
          </td>
          
          <td className="px-6 py-4">
            <StatusBadge status={post.status} />
          </td>
          
          <td className="px-6 py-4 text-sm text-gray-500">
            {formatDateTime(post.publishedAt || post.scheduledAt)}
          </td>
          
          <td className="px-6 py-4">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <MoreVertical size={20} className="text-gray-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleViewPost(post.id)}>
                  <Eye size={16} />
                  보기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditPost(post.id)}>
                  <Edit size={16} />
                  수정
                </DropdownMenuItem>
                {post.status === 'failed' && (
                  <DropdownMenuItem onClick={() => handleRetryPost(post.id)}>
                    <RefreshCw size={16} />
                    재시도
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => handleDeletePost(post.id)}
                  className="text-red-600"
                >
                  <Trash2 size={16} />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {/* 페이지네이션 */}
  <div className="p-6 border-t flex items-center justify-between">
    <p className="text-sm text-gray-500">
      총 {totalCount}건 중 {startIndex}-{endIndex}
    </p>
    
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  </div>
</Card>
```

---

# 📄 PAGE 9: 키워드 탐색 (/dashboard/keywords)

## 목적
- 실시간 트렌드 키워드 탐색
- 키워드 기반 즉시 발행
- 카테고리별 필터링

## 레이아웃
```
┌────────────────────────────────────────┐
│  인기 키워드 탐색                       │
│                                        │
│  [카테고리▼] [정렬▼] [새로고침]        │
│                                        │
│  ┌────┬────────────────────────────┐   │
│  │ 1  │ 건강 다이어트 방법         │   │
│  │    │ 건강 · 12,500 검색         │   │
│  │    │ [생성하기]                 │   │
│  ├────┼────────────────────────────┤   │
│  │ 2  │ 2024 IT 트렌드             │   │
│  │    │ IT · 8,300 검색            │   │
│  │    │ [생성하기]                 │   │
│  └────┴────────────────────────────┘   │
└────────────────────────────────────────┘
```

## UI 컴포넌트
```jsx
<div>
  {/* 헤더 */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold">인기 키워드 탐색</h1>
      <p className="text-gray-500 mt-1">
        실시간 트렌드 키워드로 즉시 콘텐츠 생성
      </p>
    </div>
    
    <Button variant="outline" onClick={handleRefresh}>
      <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
      새로고침
    </Button>
  </div>

  {/* 필터 */}
  <div className="flex items-center gap-4 mb-6">
    <Select value={categoryFilter} onChange={setCategoryFilter}>
      <option value="all">모든 카테고리</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </Select>

    <Select value={sortOrder} onChange={setSortOrder}>
      <option value="trending">인기순</option>
      <option value="recent">최신순</option>
    </Select>
  </div>

  {/* 키워드 리스트 */}
  <div className="space-y-4">
    {keywords.map((keyword, index) => (
      <Card key={keyword.id} className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-6">
          {/* 순위 */}
          <div className="text-4xl font-bold text-gray-200">
            #{index + 1}
          </div>

          {/* 키워드 정보 */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {keyword.keyword}
            </h3>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Tag size={14} />
                {keyword.category}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp size={14} />
                {keyword.trendingScore.toLocaleString()} 검색
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {formatTimeAgo(keyword.trendingAt)}
              </span>
            </div>
          </div>

          {/* 액션 */}
          <Button 
            variant="primary"
            onClick={() => handleGenerateFromKeyword(keyword)}
          >
            <Sparkles size={16} />
            콘텐츠 생성
          </Button>
        </div>
      </Card>
    ))}
  </div>
</div>
```

---

계속해서 설정 페이지들을 작성하겠습니다!

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Calendar,
  Globe,
  X,
  Edit3,
  Trash2,
  Save,
  CreditCard,
  FileText,
  Key,
  Settings,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    usageCount: number;
    monthlyLimit: number;
  } | null;
  blogCount: number;
  activeBlogCount: number;
}

interface UserDetail {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
  subscription: {
    id: string;
    plan: string;
    status: string;
    usageCount: number;
    monthlyLimit: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  blogs: Array<{
    id: string;
    platform: string;
    blogName: string;
    blogUrl: string;
    isActive: boolean;
    createdAt: string;
  }>;
  posts: {
    items: Array<{
      id: string;
      title: string;
      status: string;
      publishedUrl: string | null;
      publishedAt: string | null;
      createdAt: string;
    }>;
    total: number;
  };
  payments: Array<{
    id: string;
    amount: number;
    plan: string;
    status: string;
    paymentMethod: string | null;
    createdAt: string;
  }>;
  apiKeys: Array<{
    id: string;
    provider: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  settings: {
    isEnabled: boolean;
    preferredProvider: string;
    preferredCategories: string[];
    postsPerDay: number;
    defaultBlogId: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PLAN_NAMES: Record<string, string> = {
  free: '무료',
  light: '라이트',
  standard: '스탠다드',
  pro: '프로',
  unlimited: '언리미티드',
};

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  light: 'bg-blue-100 text-blue-700',
  standard: 'bg-green-100 text-green-700',
  pro: 'bg-purple-100 text-purple-700',
  unlimited: 'bg-orange-100 text-orange-700',
};

const POST_STATUS_NAMES: Record<string, string> = {
  draft: '초안',
  pending: '대기',
  scheduled: '예약',
  generating: '생성 중',
  generated: '생성 완료',
  publishing: '발행 중',
  published: '발행됨',
  failed: '실패',
};

const POST_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  scheduled: 'bg-blue-100 text-blue-700',
  generating: 'bg-purple-100 text-purple-700',
  generated: 'bg-indigo-100 text-indigo-700',
  publishing: 'bg-cyan-100 text-cyan-700',
  published: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${PLAN_COLORS[plan] || PLAN_COLORS.free}`}>
      {PLAN_NAMES[plan] || plan}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: '활성' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: '취소됨' },
    expired: { bg: 'bg-gray-100', text: 'text-gray-700', label: '만료' },
  };

  const config = statusConfig[status] || statusConfig.expired;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function PostStatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${POST_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
      {POST_STATUS_NAMES[status] || status}
    </span>
  );
}

// 사용자 상세 모달
function UserDetailModal({
  userId,
  onClose,
  onUpdate,
}: {
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'blogs' | 'posts' | 'payments' | 'settings'>('info');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // 편집 폼 상태
  const [editForm, setEditForm] = useState({
    name: '',
    plan: 'free',
    status: 'active',
    usageCount: 0,
  });

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setDetail(data);
      setEditForm({
        name: data.user.name || '',
        plan: data.subscription?.plan || 'free',
        status: data.subscription?.status || 'active',
        usageCount: data.subscription?.usageCount || 0,
      });
    } catch (error) {
      console.error('Fetch detail error:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: { name: editForm.name },
          subscription: {
            plan: editForm.plan,
            status: editForm.status,
            usageCount: editForm.usageCount,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      await fetchDetail();
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Save error:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (hard: boolean) => {
    if (!confirm(hard ? '정말로 이 사용자를 완전히 삭제하시겠습니까? 모든 데이터가 삭제됩니다.' : '이 사용자의 구독을 취소하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}?hard=${hard}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleBlogToggle = async (blogId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blog: { blogId, isActive: !isActive },
        }),
      });

      if (!response.ok) throw new Error('Failed to update');
      await fetchDetail();
    } catch (error) {
      console.error('Blog toggle error:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <p className="text-gray-500">사용자 정보를 불러올 수 없습니다.</p>
          <Button onClick={onClose} className="mt-4">닫기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{detail.user.name || '이름 없음'}</h2>
              <p className="text-sm text-gray-500">{detail.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit3 className="w-4 h-4 mr-1" />
                편집
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                  취소
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? '저장 중...' : '저장'}
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { id: 'info', label: '기본 정보', icon: User },
            { id: 'blogs', label: `블로그 (${detail.blogs.length})`, icon: Globe },
            { id: 'posts', label: `포스트 (${detail.posts.total})`, icon: FileText },
            { id: 'payments', label: `결제 (${detail.payments.length})`, icon: CreditCard },
            { id: 'settings', label: '설정', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  {editing ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-900">{detail.user.name || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <p className="text-gray-900">{detail.user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
                  <p className="text-gray-900">{new Date(detail.user.createdAt).toLocaleString('ko-KR')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">최근 수정</label>
                  <p className="text-gray-900">{new Date(detail.user.updatedAt).toLocaleString('ko-KR')}</p>
                </div>
              </div>

              {/* 구독 정보 */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">구독 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">플랜</label>
                    {editing ? (
                      <select
                        value={editForm.plan}
                        onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="free">무료</option>
                        <option value="light">라이트</option>
                        <option value="standard">스탠다드</option>
                        <option value="pro">프로</option>
                        <option value="unlimited">언리미티드</option>
                      </select>
                    ) : (
                      <PlanBadge plan={detail.subscription?.plan || 'free'} />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                    {editing ? (
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="active">활성</option>
                        <option value="cancelled">취소됨</option>
                        <option value="expired">만료</option>
                      </select>
                    ) : (
                      <StatusBadge status={detail.subscription?.status || 'active'} />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사용량</label>
                    {editing ? (
                      <Input
                        type="number"
                        value={editForm.usageCount}
                        onChange={(e) => setEditForm({ ...editForm, usageCount: parseInt(e.target.value) || 0 })}
                        min={0}
                      />
                    ) : (
                      <p className="text-gray-900">
                        {detail.subscription?.usageCount || 0} / {detail.subscription?.monthlyLimit === 999999 ? '무제한' : detail.subscription?.monthlyLimit || 10}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">구독 기간</label>
                    <p className="text-gray-900">
                      {detail.subscription
                        ? `${new Date(detail.subscription.currentPeriodStart).toLocaleDateString('ko-KR')} ~ ${new Date(detail.subscription.currentPeriodEnd).toLocaleDateString('ko-KR')}`
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* API 키 */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">API 키</h3>
                {detail.apiKeys.length > 0 ? (
                  <div className="space-y-2">
                    {detail.apiKeys.map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Key className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{key.provider}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${key.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {key.isActive ? '활성' : '비활성'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">등록된 API 키가 없습니다.</p>
                )}
              </div>

              {/* 삭제 영역 */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-red-600 mb-4">위험 영역</h3>
                {!deleteConfirm ? (
                  <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setDeleteConfirm(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    사용자 삭제
                  </Button>
                ) : (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">삭제 옵션을 선택하세요</p>
                        <p className="text-sm text-red-600 mt-1">이 작업은 되돌릴 수 없습니다.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleDelete(false)}>
                        구독만 취소
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-100" onClick={() => handleDelete(true)}>
                        완전 삭제
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>
                        취소
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'blogs' && (
            <div className="space-y-4">
              {detail.blogs.length > 0 ? (
                detail.blogs.map((blog) => (
                  <div key={blog.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${blog.platform === 'blogger' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                        <Globe className={`w-5 h-5 ${blog.platform === 'blogger' ? 'text-orange-600' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{blog.blogName}</p>
                        <a href={blog.blogUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                          {blog.blogUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 capitalize">{blog.platform}</span>
                      <button
                        onClick={() => handleBlogToggle(blog.id, blog.isActive)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          blog.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {blog.isActive ? '활성' : '비활성'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">연동된 블로그가 없습니다.</p>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4">
              {detail.posts.items.length > 0 ? (
                detail.posts.items.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{post.title}</p>
                      <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleString('ko-KR')}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <PostStatusBadge status={post.status} />
                      {post.publishedUrl && (
                        <a href={post.publishedUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">작성된 포스트가 없습니다.</p>
              )}
              {detail.posts.total > detail.posts.items.length && (
                <p className="text-sm text-gray-500 text-center">외 {detail.posts.total - detail.posts.items.length}개의 포스트</p>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              {detail.payments.length > 0 ? (
                detail.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <PlanBadge plan={payment.plan} />
                        <span className="font-medium text-gray-900">
                          {payment.amount.toLocaleString()}원
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(payment.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {payment.status === 'completed' ? '완료' : payment.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">결제 내역이 없습니다.</p>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {detail.settings ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">자동 생성</label>
                      <p className={`${detail.settings.isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                        {detail.settings.isEnabled ? '활성화' : '비활성화'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">AI 제공자</label>
                      <p className="text-gray-900 capitalize">{detail.settings.preferredProvider || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">일일 포스트 수</label>
                      <p className="text-gray-900">{detail.settings.postsPerDay || 0}개</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">선호 카테고리</label>
                      <div className="flex flex-wrap gap-1">
                        {detail.settings.preferredCategories?.length > 0 ? (
                          detail.settings.preferredCategories.map((cat) => (
                            <span key={cat} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {cat}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">없음</span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">설정 정보가 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async (page: number, searchQuery: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchQuery,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error('사용자 목록을 불러올 수 없습니다.');
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(pagination.page, search);
  }, [pagination.page, search, fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleUserUpdate = () => {
    fetchUsers(pagination.page, search);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          전체 {pagination.total}명의 사용자
        </p>
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="이메일 또는 이름으로 검색"
              className="pl-10"
            />
          </div>
          <Button type="submit">검색</Button>
        </div>
      </form>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  구독
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  사용량
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  블로그
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="animate-pulse h-6 bg-gray-200 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {search ? '검색 결과가 없습니다.' : '사용자가 없습니다.'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name || '이름 없음'}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.subscription ? (
                        <div className="flex items-center gap-2">
                          <PlanBadge plan={user.subscription.plan} />
                          <StatusBadge status={user.subscription.status} />
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">구독 없음</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.subscription ? (
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">
                            {user.subscription.usageCount}
                          </span>
                          <span className="text-gray-500">
                            {' '}
                            / {user.subscription.monthlyLimit === 999999
                              ? '무제한'
                              : user.subscription.monthlyLimit}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{user.activeBlogCount}</span>
                        <span className="text-gray-400">/ {user.blogCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUserId(user.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        상세
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} /{' '}
              {pagination.total}명
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 사용자 상세 모달 */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Globe, FileText, Trash2, Edit, ExternalLink, CheckCircle, XCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORIES } from '@/lib/constants/categories';

interface Blog {
  id: string;
  name: string;
  url: string;
  platform: 'tistory' | 'blogger' | 'wordpress';
  categories: string[];
  is_active: boolean;
  created_at: string;
  external_blog_id?: string;
}

interface BlogsResponse {
  success: boolean;
  blogs?: Blog[];
  error?: string;
}

const MAX_BLOGS = 3;

const PLATFORM_INFO = {
  tistory: {
    name: '티스토리',
    icon: '📝',
    color: 'bg-green-50 border-green-200',
    textColor: 'text-green-700',
  },
  blogger: {
    name: '구글 블로그',
    icon: '🔵',
    color: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700',
  },
  wordpress: {
    name: '워드프레스',
    icon: '⚙️',
    color: 'bg-purple-50 border-purple-200',
    textColor: 'text-purple-700',
  },
};

function getCategoryName(categoryId: string): string {
  const category = CATEGORIES.find((cat) => cat.id === categoryId);
  return category?.name || categoryId;
}

export default function BlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    categories: [] as string[],
    is_active: true,
    external_blog_id: '',
    access_token: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      const response = await fetch('/api/user/blogs');
      const data: BlogsResponse = await response.json();

      if (!data.success || !data.blogs) {
        toast.error(data.error || '블로그 목록을 불러올 수 없습니다.');
        return;
      }

      setBlogs(data.blogs);
    } catch (error) {
      console.error('Load blogs error:', error);
      toast.error('블로그 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId: string, blogName: string) => {
    if (!confirm(`"${blogName}" 블로그 연결을 해제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/user/blogs/${blogId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || '블로그 연결 해제에 실패했습니다.');
        return;
      }

      toast.success('블로그 연결이 해제되었습니다.');
      loadBlogs();
    } catch (error) {
      console.error('Delete blog error:', error);
      toast.error('블로그 연결 해제 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setEditFormData({
      name: blog.name || blog.url,
      categories: blog.categories || [],
      is_active: blog.is_active,
      external_blog_id: blog.external_blog_id || '',
      access_token: '', // 보안상 기존 값 표시하지 않음
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingBlog) return;

    setEditLoading(true);
    try {
      // 업데이트할 데이터 구성 (빈 값은 제외)
      const updateData: Record<string, unknown> = {
        name: editFormData.name,
        categories: editFormData.categories,
        is_active: editFormData.is_active,
      };

      // Blog ID가 입력된 경우만 포함
      if (editFormData.external_blog_id.trim()) {
        updateData.external_blog_id = editFormData.external_blog_id.trim();
      }

      // API Key/Token이 입력된 경우만 포함
      if (editFormData.access_token.trim()) {
        updateData.access_token = editFormData.access_token.trim();
      }

      const response = await fetch(`/api/user/blogs/${editingBlog.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || '블로그 수정에 실패했습니다.');
        return;
      }

      toast.success('블로그 정보가 수정되었습니다.');
      setEditModalOpen(false);
      setEditingBlog(null);
      loadBlogs();
    } catch (error) {
      console.error('Edit blog error:', error);
      toast.error('블로그 수정 중 오류가 발생했습니다.');
    } finally {
      setEditLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setEditFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 border-[#cdd6ea]">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-[#cdd6ea] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f0f4ff] flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#4562a1]" />
            </div>
            <div>
              <p className="text-sm text-[#4562a1]">연동된 블로그</p>
              <p className="text-2xl font-bold text-[#0c111d]">{blogs.length}/{MAX_BLOGS}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-[#cdd6ea] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[#4562a1]">활성화</p>
              <p className="text-2xl font-bold text-[#0c111d]">{blogs.filter(b => b.is_active).length}개</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-[#cdd6ea] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-[#4562a1]">비활성화</p>
              <p className="text-2xl font-bold text-[#0c111d]">{blogs.filter(b => !b.is_active).length}개</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 블로그 목록 카드 */}
      <Card className="border-[#cdd6ea] shadow-sm">
        <div className="p-6 border-b border-[#e6ebf4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-[#4562a1]" />
            <div>
              <h2 className="text-lg font-semibold text-[#0c111d]">연동된 블로그</h2>
              <p className="text-sm text-[#4562a1]">최대 {MAX_BLOGS}개까지 연동 가능</p>
            </div>
          </div>

          {blogs.length < MAX_BLOGS && (
            <Button
              onClick={() => router.push('/onboarding/connect-blog')}
              className="bg-[#4562a1] hover:bg-[#3a5289]"
            >
              <Plus size={16} className="mr-2" />
              블로그 추가
            </Button>
          )}
        </div>

        <div className="p-6">
          {blogs.length > 0 ? (
            <div className="space-y-4">
              {blogs.map((blog) => {
                const platformInfo = PLATFORM_INFO[blog.platform];

                return (
                  <div
                    key={blog.id}
                    className={`p-4 rounded-xl border ${platformInfo.color} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* 플랫폼 아이콘 */}
                        <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">{platformInfo.icon}</span>
                        </div>

                        {/* 블로그 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${platformInfo.textColor} bg-white border`}>
                              {platformInfo.name}
                            </Badge>
                            <Badge
                              variant={blog.is_active ? 'default' : 'secondary'}
                              className={
                                blog.is_active
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                              }
                            >
                              {blog.is_active ? '활성화' : '비활성화'}
                            </Badge>
                          </div>

                          <h3 className="font-semibold text-[#0c111d] mb-2 truncate">
                            {blog.url}
                          </h3>

                          <div className="flex items-center gap-4 text-sm text-[#4562a1] flex-wrap">
                            {blog.categories.length > 0 ? (
                              <span className="flex items-center gap-1">
                                <FileText size={14} />
                                {blog.categories.map(getCategoryName).join(', ')}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-400">
                                <FileText size={14} />
                                카테고리 없음
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://${blog.url}`, '_blank')}
                          className="border-[#cdd6ea] text-[#4562a1] hover:bg-white"
                        >
                          <ExternalLink size={14} className="mr-1" />
                          방문
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(blog)}
                          className="border-[#cdd6ea] text-[#4562a1] hover:bg-white"
                        >
                          <Edit size={14} className="mr-1" />
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(blog.id, blog.url)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} className="mr-1" />
                          해제
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 빈 상태 */
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f0f4ff] flex items-center justify-center">
                <Globe className="w-8 h-8 text-[#4562a1]" />
              </div>
              <h3 className="text-lg font-semibold text-[#0c111d] mb-2">
                연동된 블로그가 없습니다
              </h3>
              <p className="text-[#4562a1] mb-6">
                블로그를 추가하고 자동 발행을 시작하세요
              </p>
              <Button
                onClick={() => router.push('/onboarding/connect-blog')}
                className="bg-[#4562a1] hover:bg-[#3a5289]"
              >
                <Plus size={16} className="mr-2" />
                블로그 추가하기
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 안내 카드 */}
      <Card className="p-6 bg-[#f0f4ff] border-[#cdd6ea]">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-[#4562a1]" />
          </div>
          <div>
            <h4 className="font-semibold text-[#0c111d] mb-1">블로그 연동 안내</h4>
            <p className="text-sm text-[#4562a1]">
              티스토리, 구글 블로그, 워드프레스 블로그를 연동하면 키워드 기반으로 자동 콘텐츠 생성 및 발행이 가능합니다.
              각 플랫폼의 API 또는 OAuth 인증을 통해 안전하게 연동됩니다.
            </p>
          </div>
        </div>
      </Card>

      {/* 블로그 수정 모달 */}
      {editModalOpen && editingBlog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg border-[#cdd6ea] shadow-xl">
            <div className="p-6 border-b border-[#e6ebf4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit className="w-6 h-6 text-[#4562a1]" />
                <h3 className="text-xl font-bold text-[#0c111d]">블로그 수정</h3>
              </div>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingBlog(null);
                }}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 블로그 URL (읽기 전용) */}
              <div>
                <label className="block text-sm font-medium text-[#0c111d] mb-2">
                  블로그 URL
                </label>
                <div className="px-4 py-2 bg-[#f9fafa] border border-[#cdd6ea] rounded-lg text-[#4562a1]">
                  {editingBlog.url}
                </div>
              </div>

              {/* 블로그 이름 */}
              <div>
                <label className="block text-sm font-medium text-[#0c111d] mb-2">
                  블로그 이름
                </label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="블로그 이름을 입력하세요"
                  className="border-[#cdd6ea] focus:border-[#4562a1] focus:ring-[#4562a1]"
                />
              </div>

              {/* 활성화 상태 */}
              <div>
                <label className="block text-sm font-medium text-[#0c111d] mb-2">
                  상태
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="is_active"
                      checked={editFormData.is_active}
                      onChange={() => setEditFormData({ ...editFormData, is_active: true })}
                      className="w-4 h-4 text-[#4562a1]"
                    />
                    <span className="text-sm text-[#0c111d]">활성화</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="is_active"
                      checked={!editFormData.is_active}
                      onChange={() => setEditFormData({ ...editFormData, is_active: false })}
                      className="w-4 h-4 text-[#4562a1]"
                    />
                    <span className="text-sm text-[#0c111d]">비활성화</span>
                  </label>
                </div>
              </div>

              {/* Blog ID (Blogger 전용) */}
              {editingBlog.platform === 'blogger' && (
                <div>
                  <label className="block text-sm font-medium text-[#0c111d] mb-2">
                    Blog ID
                  </label>
                  <Input
                    value={editFormData.external_blog_id}
                    onChange={(e) => setEditFormData({ ...editFormData, external_blog_id: e.target.value })}
                    placeholder="Blogger Blog ID (예: 1234567890123456789)"
                    className="border-[#cdd6ea] focus:border-[#4562a1] focus:ring-[#4562a1]"
                  />
                  <p className="mt-1 text-xs text-[#4562a1]">
                    Blogger 대시보드 URL에서 확인: blogger.com/blog/posts/<strong>숫자ID</strong>
                  </p>
                </div>
              )}

              {/* API Key / Access Token */}
              <div>
                <label className="block text-sm font-medium text-[#0c111d] mb-2">
                  {editingBlog.platform === 'tistory' ? 'Access Token' :
                   editingBlog.platform === 'blogger' ? 'API Key' :
                   'Application Password'}
                </label>
                <Input
                  type="password"
                  value={editFormData.access_token}
                  onChange={(e) => setEditFormData({ ...editFormData, access_token: e.target.value })}
                  placeholder="변경하려면 새 값을 입력하세요"
                  className="border-[#cdd6ea] focus:border-[#4562a1] focus:ring-[#4562a1]"
                />
                <p className="mt-1 text-xs text-[#4562a1]">
                  비워두면 기존 값이 유지됩니다
                </p>
              </div>

              {/* 카테고리 선택 */}
              <div>
                <label className="block text-sm font-medium text-[#0c111d] mb-2">
                  카테고리
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        editFormData.categories.includes(category.id)
                          ? 'bg-[#4562a1] text-white'
                          : 'bg-[#f0f4ff] text-[#4562a1] hover:bg-[#e0e8ff]'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#e6ebf4] flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingBlog(null);
                }}
                className="border-[#cdd6ea]"
              >
                취소
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={editLoading}
                className="bg-[#4562a1] hover:bg-[#3a5289]"
              >
                {editLoading ? '저장 중...' : '저장'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

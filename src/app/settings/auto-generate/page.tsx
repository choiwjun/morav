'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Clock, Target, Zap, AlertCircle } from 'lucide-react';

const AI_PROVIDERS = [
  { id: 'openai', name: 'OpenAI (GPT-4)', description: '가장 안정적인 결과물' },
  { id: 'claude', name: 'Claude', description: '자연스러운 문체' },
  { id: 'gemini', name: 'Google Gemini', description: '빠른 응답 속도' },
  { id: 'grok', name: 'Grok (xAI)', description: '최신 트렌드 반영' },
];

const CATEGORIES = [
  { id: 'it', name: 'IT/기술' },
  { id: 'economy', name: '경제/금융' },
  { id: 'lifestyle', name: '라이프스타일' },
  { id: 'health', name: '건강/의료' },
  { id: 'entertainment', name: '엔터테인먼트' },
  { id: 'sports', name: '스포츠' },
  { id: 'travel', name: '여행' },
  { id: 'food', name: '음식/맛집' },
  { id: 'fashion', name: '패션/뷰티' },
  { id: 'education', name: '교육' },
];

interface Settings {
  is_enabled: boolean;
  preferred_provider: string;
  preferred_categories: string[];
  posts_per_day: number;
  default_blog_id: string | null;
}

interface Schedule {
  publish_time: string;
  publish_days: string[];
  timezone: string;
  is_active: boolean;
}

interface Blog {
  id: string;
  blog_name: string;
  platform: string;
}

export default function AutoGenerateSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    is_enabled: false,
    preferred_provider: 'openai',
    preferred_categories: [],
    posts_per_day: 1,
    default_blog_id: null,
  });
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/auto-generate');
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
        setSchedule(data.schedule);
        setBlogs(data.blogs);
        setAvailableProviders(data.availableProviders);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: settings.is_enabled,
          preferredProvider: settings.preferred_provider,
          preferredCategories: settings.preferred_categories,
          postsPerDay: settings.posts_per_day,
          defaultBlogId: settings.default_blog_id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('설정이 저장되었습니다.');
      } else {
        alert(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSettings((prev) => ({
      ...prev,
      preferred_categories: prev.preferred_categories.includes(categoryId)
        ? prev.preferred_categories.filter((c) => c !== categoryId)
        : [...prev.preferred_categories, categoryId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasRequirements = blogs.length > 0 && availableProviders.length > 0 && schedule?.is_active;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">자동 콘텐츠 생성</h1>
        <p className="text-muted-foreground">
          인기 키워드를 기반으로 AI가 자동으로 블로그 콘텐츠를 생성합니다.
        </p>
      </div>

      {/* 요구 사항 체크 */}
      {!hasRequirements && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              자동 생성 활성화 조건
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                {blogs.length > 0 ? (
                  <Badge variant="default" className="bg-green-500">완료</Badge>
                ) : (
                  <Badge variant="outline">필요</Badge>
                )}
                연결된 블로그 1개 이상
              </li>
              <li className="flex items-center gap-2">
                {availableProviders.length > 0 ? (
                  <Badge variant="default" className="bg-green-500">완료</Badge>
                ) : (
                  <Badge variant="outline">필요</Badge>
                )}
                등록된 AI API 키 1개 이상
              </li>
              <li className="flex items-center gap-2">
                {schedule?.is_active ? (
                  <Badge variant="default" className="bg-green-500">완료</Badge>
                ) : (
                  <Badge variant="outline">필요</Badge>
                )}
                발행 스케줄 설정
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 자동 생성 활성화 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            자동 생성 활성화
          </CardTitle>
          <CardDescription>
            활성화하면 설정된 스케줄에 따라 자동으로 콘텐츠가 생성됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>자동 생성 활성화</Label>
              <p className="text-sm text-muted-foreground">
                인기 키워드 기반 콘텐츠 자동 생성
              </p>
            </div>
            <Switch
              checked={settings.is_enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, is_enabled: checked }))
              }
              disabled={!hasRequirements}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI 제공자 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI 제공자
          </CardTitle>
          <CardDescription>
            콘텐츠 생성에 사용할 AI 서비스를 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>선호 AI 제공자</Label>
            <Select
              value={settings.preferred_provider}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, preferred_provider: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="AI 제공자 선택" />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map((provider) => (
                  <SelectItem
                    key={provider.id}
                    value={provider.id}
                    disabled={!availableProviders.includes(provider.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{provider.name}</span>
                      {!availableProviders.includes(provider.id) && (
                        <Badge variant="outline" className="text-xs">API 키 필요</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableProviders.length === 0 && (
            <p className="text-sm text-muted-foreground">
              설정 &gt; API 키에서 AI 서비스 API 키를 등록해주세요.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 대상 블로그 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            대상 블로그
          </CardTitle>
          <CardDescription>
            자동 생성된 콘텐츠가 발행될 블로그를 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>기본 블로그</Label>
            <Select
              value={settings.default_blog_id || ''}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, default_blog_id: value || null }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="블로그 선택" />
              </SelectTrigger>
              <SelectContent>
                {blogs.map((blog) => (
                  <SelectItem key={blog.id} value={blog.id}>
                    <div className="flex items-center gap-2">
                      <span>{blog.blog_name}</span>
                      <Badge variant="outline" className="text-xs">{blog.platform}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {blogs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              설정 &gt; 블로그에서 블로그를 연결해주세요.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 선호 카테고리 */}
      <Card>
        <CardHeader>
          <CardTitle>선호 카테고리</CardTitle>
          <CardDescription>
            이 카테고리의 키워드를 우선적으로 선택합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {CATEGORIES.map((category) => (
              <div
                key={category.id}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={category.id}
                  checked={settings.preferred_categories.includes(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                />
                <Label
                  htmlFor={category.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 생성 빈도 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            생성 빈도
          </CardTitle>
          <CardDescription>
            하루에 생성할 콘텐츠 수를 설정하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>일일 생성 수</Label>
            <Select
              value={String(settings.posts_per_day)}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, posts_per_day: Number(value) }))
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 10].map((num) => (
                  <SelectItem key={num} value={String(num)}>
                    하루 {num}개
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {schedule && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">현재 발행 스케줄</p>
              <p className="text-sm text-muted-foreground">
                매주 {schedule.publish_days.join(', ')} {schedule.publish_time}에 발행
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          설정 저장
        </Button>
      </div>
    </div>
  );
}

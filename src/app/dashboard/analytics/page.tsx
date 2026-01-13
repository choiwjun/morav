'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  totalPosts: number;
  publishedPosts: number;
  failedPosts: number;
  successRate: number;
  thisWeekPosts: number;
  lastWeekPosts: number;
  weeklyGrowth: number;
  thisMonthPosts: number;
  lastMonthPosts: number;
  monthlyGrowth: number;
  topKeywords: { keyword: string; count: number }[];
  topBlogs: { name: string; platform: string; count: number }[];
  dailyStats: { date: string; count: number; success: number; failed: number }[];
}

interface AnalyticsResponse {
  success: boolean;
  data?: AnalyticsData;
  error?: string;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?period=${period}`);
      const data: AnalyticsResponse = await response.json();

      if (data.success && data.data) {
        setAnalytics(data.data);
      } else {
        // API가 없을 경우 기본 데이터 사용
        setAnalytics({
          totalPosts: 0,
          publishedPosts: 0,
          failedPosts: 0,
          successRate: 0,
          thisWeekPosts: 0,
          lastWeekPosts: 0,
          weeklyGrowth: 0,
          thisMonthPosts: 0,
          lastMonthPosts: 0,
          monthlyGrowth: 0,
          topKeywords: [],
          topBlogs: [],
          dailyStats: [],
        });
      }
    } catch (error) {
      console.error('Load analytics error:', error);
      // API 에러 시 기본 데이터 표시
      setAnalytics({
        totalPosts: 0,
        publishedPosts: 0,
        failedPosts: 0,
        successRate: 0,
        thisWeekPosts: 0,
        lastWeekPosts: 0,
        weeklyGrowth: 0,
        thisMonthPosts: 0,
        lastMonthPosts: 0,
        monthlyGrowth: 0,
        topKeywords: [],
        topBlogs: [],
        dailyStats: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
    toast.success('데이터를 새로고침했습니다.');
  };

  const formatGrowth = (value: number) => {
    if (value > 0) return `+${value.toFixed(1)}%`;
    if (value < 0) return `${value.toFixed(1)}%`;
    return '0%';
  };

  return (
    <div className="bg-[#f9fafa] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-[#f9fafa]/95 backdrop-blur-sm">
        <div className="flex flex-col gap-0.5 mb-3 sm:mb-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0c111d]">
            분석 리포트
          </h1>
          <p className="text-xs sm:text-sm text-[#4562a1]">
            발행 현황과 성과를 한눈에 확인하세요
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 기간 선택 */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'all')}
            className="px-4 py-2 border border-[#cdd6ea] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-[#0c111d]"
          >
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
            <option value="all">전체</option>
          </select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-[#cdd6ea] text-[#4562a1] hover:bg-[#f0f4ff]"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin mr-2' : 'mr-2'} />
            새로고침
          </Button>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-[#4562a1]">데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {/* 총 발행 */}
              <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f0f4ff] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#4562a1]" />
                  </div>
                  <p className="text-sm text-[#4562a1] font-medium">총 발행</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-[#0c111d]">
                  {analytics?.totalPosts.toLocaleString() || 0}
                  <span className="text-base font-normal text-[#4562a1] ml-1">건</span>
                </p>
              </div>

              {/* 발행 성공 */}
              <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-[#07883d]" />
                  </div>
                  <p className="text-sm text-[#4562a1] font-medium">성공</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-[#07883d]">
                  {analytics?.publishedPosts.toLocaleString() || 0}
                  <span className="text-base font-normal text-[#4562a1] ml-1">건</span>
                </p>
              </div>

              {/* 발행 실패 */}
              <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-sm text-[#4562a1] font-medium">실패</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-red-500">
                  {analytics?.failedPosts.toLocaleString() || 0}
                  <span className="text-base font-normal text-[#4562a1] ml-1">건</span>
                </p>
              </div>

              {/* 성공률 */}
              <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-sm text-[#4562a1] font-medium">성공률</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-purple-500">
                  {analytics?.successRate.toFixed(1) || 0}
                  <span className="text-base font-normal ml-0.5">%</span>
                </p>
              </div>
            </div>

            {/* Growth Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* 주간 성장 */}
              <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#f0f4ff] flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#4562a1]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#4562a1] font-medium">주간 발행</p>
                      <p className="text-xs text-[#4562a1]">지난주 대비</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 ${
                      (analytics?.weeklyGrowth || 0) >= 0
                        ? 'text-[#07883d] bg-green-50 border-green-200'
                        : 'text-red-500 bg-red-50 border-red-200'
                    }`}
                  >
                    {(analytics?.weeklyGrowth || 0) >= 0 ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}
                    {formatGrowth(analytics?.weeklyGrowth || 0)}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-4">
                  <div>
                    <p className="text-3xl font-bold text-[#0c111d]">
                      {analytics?.thisWeekPosts || 0}
                    </p>
                    <p className="text-xs text-[#4562a1]">이번 주</p>
                  </div>
                  <div className="text-[#cdd6ea]">vs</div>
                  <div>
                    <p className="text-xl font-semibold text-[#4562a1]">
                      {analytics?.lastWeekPosts || 0}
                    </p>
                    <p className="text-xs text-[#4562a1]">지난 주</p>
                  </div>
                </div>
              </div>

              {/* 월간 성장 */}
              <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#f0f4ff] flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-[#4562a1]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#4562a1] font-medium">월간 발행</p>
                      <p className="text-xs text-[#4562a1]">지난달 대비</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 ${
                      (analytics?.monthlyGrowth || 0) >= 0
                        ? 'text-[#07883d] bg-green-50 border-green-200'
                        : 'text-red-500 bg-red-50 border-red-200'
                    }`}
                  >
                    {(analytics?.monthlyGrowth || 0) >= 0 ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}
                    {formatGrowth(analytics?.monthlyGrowth || 0)}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-4">
                  <div>
                    <p className="text-3xl font-bold text-[#0c111d]">
                      {analytics?.thisMonthPosts || 0}
                    </p>
                    <p className="text-xs text-[#4562a1]">이번 달</p>
                  </div>
                  <div className="text-[#cdd6ea]">vs</div>
                  <div>
                    <p className="text-xl font-semibold text-[#4562a1]">
                      {analytics?.lastMonthPosts || 0}
                    </p>
                    <p className="text-xs text-[#4562a1]">지난 달</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Keywords & Blogs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 인기 키워드 */}
              <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm">
                <div className="p-4 sm:p-6 border-b border-[#cdd6ea]">
                  <h3 className="font-semibold text-[#0c111d]">인기 키워드 TOP 5</h3>
                  <p className="text-xs text-[#4562a1] mt-1">가장 많이 발행된 키워드</p>
                </div>
                <div className="p-4 sm:p-6">
                  {analytics?.topKeywords && analytics.topKeywords.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.topKeywords.slice(0, 5).map((item, index) => (
                        <div
                          key={item.keyword}
                          className="flex items-center justify-between p-3 bg-[#f9fafa] rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#f0f4ff] flex items-center justify-center text-xs font-bold text-[#4562a1]">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-[#0c111d]">
                              {item.keyword}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs border-[#cdd6ea] text-[#4562a1]">
                            {item.count}건
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-10 h-10 text-[#cdd6ea] mx-auto mb-3" />
                      <p className="text-sm text-[#4562a1]">발행된 키워드가 없습니다</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 블로그별 발행 현황 */}
              <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm">
                <div className="p-4 sm:p-6 border-b border-[#cdd6ea]">
                  <h3 className="font-semibold text-[#0c111d]">블로그별 발행 현황</h3>
                  <p className="text-xs text-[#4562a1] mt-1">블로그별 발행 건수</p>
                </div>
                <div className="p-4 sm:p-6">
                  {analytics?.topBlogs && analytics.topBlogs.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.topBlogs.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between p-3 bg-[#f9fafa] rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#f0f4ff] flex items-center justify-center text-xs font-bold text-[#4562a1]">
                              {index + 1}
                            </span>
                            <div>
                              <span className="text-sm font-medium text-[#0c111d] block">
                                {item.name}
                              </span>
                              <span className="text-xs text-[#4562a1]">{item.platform}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs border-[#cdd6ea] text-[#4562a1]">
                            {item.count}건
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-10 h-10 text-[#cdd6ea] mx-auto mb-3" />
                      <p className="text-sm text-[#4562a1]">연결된 블로그가 없습니다</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Coming Soon Notice */}
            <div className="mt-6 bg-[#f0f4ff] border border-[#cdd6ea] rounded-xl p-6 text-center">
              <TrendingUp className="w-10 h-10 text-[#4562a1] mx-auto mb-3" />
              <h3 className="font-semibold text-[#0c111d] mb-2">더 많은 분석 기능이 준비 중입니다</h3>
              <p className="text-sm text-[#4562a1]">
                일별 추이 그래프, 블로그별 성과 비교, 키워드 효율 분석 등 다양한 기능이 곧 추가됩니다.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

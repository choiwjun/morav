'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bell, Mail, CheckCircle, XCircle, AlertTriangle, CreditCard, BellRing, BellOff, BarChart3, Megaphone, Smartphone } from 'lucide-react';

interface NotificationSettings {
  // 이메일 알림
  email_on_publish_success: boolean;
  email_on_publish_fail: boolean;
  email_on_subscription_change: boolean;
  email_on_usage_limit: boolean;
  // 주간 리포트
  email_weekly_report: boolean;
  // 마케팅 알림
  email_marketing: boolean;
  email_product_updates: boolean;
  // 앱 푸시 알림
  push_enabled: boolean;
  push_on_publish: boolean;
  push_on_important: boolean;
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_on_publish_success: true,
    email_on_publish_fail: true,
    email_on_subscription_change: true,
    email_on_usage_limit: true,
    email_weekly_report: true,
    email_marketing: false,
    email_product_updates: true,
    push_enabled: false,
    push_on_publish: true,
    push_on_important: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();

      if (data.success && data.settings) {
        setSettings({
          email_on_publish_success: data.settings.email_on_publish_success ?? true,
          email_on_publish_fail: data.settings.email_on_publish_fail ?? true,
          email_on_subscription_change: data.settings.email_on_subscription_change ?? true,
          email_on_usage_limit: data.settings.email_on_usage_limit ?? true,
          email_weekly_report: data.settings.email_weekly_report ?? true,
          email_marketing: data.settings.email_marketing ?? false,
          email_product_updates: data.settings.email_product_updates ?? true,
          push_enabled: data.settings.push_enabled ?? false,
          push_on_publish: data.settings.push_on_publish ?? true,
          push_on_important: data.settings.push_on_important ?? true,
        });
      }
    } catch (error) {
      console.error('Load settings error:', error);
      toast.error('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('알림 설정이 저장되었습니다.');
      } else {
        toast.error(data.error || '설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 이메일 알림 옵션
  const emailNotificationOptions = [
    {
      key: 'email_on_publish_success' as const,
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      title: '발행 성공 알림',
      description: '포스트가 블로그에 성공적으로 발행되면 이메일로 알려드립니다.',
    },
    {
      key: 'email_on_publish_fail' as const,
      icon: XCircle,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-500',
      title: '발행 실패 알림',
      description: '포스트 발행에 실패하면 이메일로 알려드립니다.',
    },
    {
      key: 'email_on_subscription_change' as const,
      icon: CreditCard,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500',
      title: '구독 변경 알림',
      description: '플랜 변경, 결제 완료 등 구독 상태가 변경되면 이메일로 알려드립니다.',
    },
    {
      key: 'email_on_usage_limit' as const,
      icon: AlertTriangle,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500',
      title: '사용량 한도 알림',
      description: '월 발행 한도에 가까워지거나 도달하면 이메일로 알려드립니다.',
    },
  ];

  // 주간 리포트 옵션
  const weeklyReportOption = {
    key: 'email_weekly_report' as const,
    icon: BarChart3,
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    title: '주간 리포트',
    description: '매주 발행 현황, 통계 등을 정리한 주간 리포트를 이메일로 받아보세요.',
  };

  // 마케팅 알림 옵션
  const marketingOptions = [
    {
      key: 'email_marketing' as const,
      icon: Megaphone,
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      title: '마케팅 및 프로모션',
      description: '특별 할인, 이벤트, 프로모션 정보를 이메일로 받아보세요.',
    },
    {
      key: 'email_product_updates' as const,
      icon: Bell,
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      title: '제품 업데이트',
      description: '새로운 기능, 서비스 개선 사항 등을 이메일로 알려드립니다.',
    },
  ];

  // 앱 푸시 알림 옵션
  const pushOptions = [
    {
      key: 'push_enabled' as const,
      icon: Smartphone,
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      title: '푸시 알림 활성화',
      description: '브라우저 푸시 알림을 활성화합니다. (준비 중)',
      disabled: true,
    },
    {
      key: 'push_on_publish' as const,
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      title: '발행 완료 푸시',
      description: '포스트 발행이 완료되면 푸시 알림을 보내드립니다.',
      parentKey: 'push_enabled' as const,
    },
    {
      key: 'push_on_important' as const,
      icon: AlertTriangle,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500',
      title: '중요 알림 푸시',
      description: '발행 실패, 사용량 한도 등 중요한 알림을 푸시로 보내드립니다.',
      parentKey: 'push_enabled' as const,
    },
  ];

  // 활성화된 알림 수 계산
  const enabledCount = Object.values(settings).filter(Boolean).length;
  const totalCount = Object.keys(settings).length;

  // 옵션 렌더링 헬퍼 함수
  const renderOption = (option: {
    key: keyof NotificationSettings;
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    iconColor: string;
    title: string;
    description: string;
    disabled?: boolean;
    parentKey?: keyof NotificationSettings;
  }) => {
    const IconComponent = option.icon;
    const isEnabled = settings[option.key];
    const isDisabled = option.disabled || (option.parentKey && !settings[option.parentKey]);

    return (
      <div
        key={option.key}
        className={`p-4 rounded-xl border transition-all ${
          isDisabled
            ? 'bg-gray-50 border-gray-200 opacity-60'
            : isEnabled
            ? `${option.bgColor} border-transparent`
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className={`w-10 h-10 rounded-lg ${isEnabled && !isDisabled ? 'bg-white' : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
              <IconComponent className={`w-5 h-5 ${isEnabled && !isDisabled ? option.iconColor : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className={`font-medium ${isEnabled && !isDisabled ? 'text-[#0c111d]' : 'text-gray-500'}`}>
                  {option.title}
                </p>
                {option.disabled && (
                  <Badge className="bg-gray-100 text-gray-500 border-gray-200">
                    준비 중
                  </Badge>
                )}
                {!option.disabled && (
                  <Badge
                    variant={isEnabled ? 'default' : 'secondary'}
                    className={
                      isEnabled
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }
                  >
                    {isEnabled ? 'ON' : 'OFF'}
                  </Badge>
                )}
              </div>
              <p className={`text-sm ${isEnabled && !isDisabled ? 'text-[#4562a1]' : 'text-gray-400'}`}>
                {option.description}
              </p>
            </div>
          </div>
          <button
            onClick={() => !isDisabled && handleToggle(option.key)}
            disabled={isDisabled}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${
              isDisabled
                ? 'bg-gray-200 cursor-not-allowed'
                : isEnabled
                ? 'bg-[#4562a1]'
                : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    );
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
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
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
              <Bell className="w-5 h-5 text-[#4562a1]" />
            </div>
            <div>
              <p className="text-sm text-[#4562a1]">알림 설정</p>
              <p className="text-2xl font-bold text-[#0c111d]">{enabledCount}/{totalCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-[#cdd6ea] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[#4562a1]">활성화</p>
              <p className="text-2xl font-bold text-[#0c111d]">{enabledCount}개</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-[#cdd6ea] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <BellOff className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-[#4562a1]">비활성화</p>
              <p className="text-2xl font-bold text-[#0c111d]">{totalCount - enabledCount}개</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 이메일 알림 설정 카드 */}
      <Card className="border-[#cdd6ea] shadow-sm">
        <div className="p-6 border-b border-[#e6ebf4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-[#4562a1]" />
            <div>
              <h2 className="text-lg font-semibold text-[#0c111d]">이메일 알림</h2>
              <p className="text-sm text-[#4562a1]">서비스 관련 중요 알림을 이메일로 받아보세요</p>
            </div>
          </div>
          <Badge className="bg-[#f0f4ff] text-[#4562a1] border-[#cdd6ea]">
            {emailNotificationOptions.filter(o => settings[o.key]).length}개 활성화
          </Badge>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {emailNotificationOptions.map(renderOption)}
          </div>
        </div>
      </Card>

      {/* 주간 리포트 카드 */}
      <Card className="border-[#cdd6ea] shadow-sm">
        <div className="p-6 border-b border-[#e6ebf4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-lg font-semibold text-[#0c111d]">주간 리포트</h2>
              <p className="text-sm text-[#4562a1]">매주 발행 현황과 통계를 받아보세요</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {renderOption(weeklyReportOption)}
        </div>
      </Card>

      {/* 마케팅 알림 카드 */}
      <Card className="border-[#cdd6ea] shadow-sm">
        <div className="p-6 border-b border-[#e6ebf4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-pink-600" />
            <div>
              <h2 className="text-lg font-semibold text-[#0c111d]">마케팅 알림</h2>
              <p className="text-sm text-[#4562a1]">프로모션 및 제품 업데이트 정보</p>
            </div>
          </div>
          <Badge className="bg-[#f0f4ff] text-[#4562a1] border-[#cdd6ea]">
            {marketingOptions.filter(o => settings[o.key]).length}개 활성화
          </Badge>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {marketingOptions.map(renderOption)}
          </div>
        </div>
      </Card>

      {/* 앱 푸시 알림 카드 */}
      <Card className="border-[#cdd6ea] shadow-sm">
        <div className="p-6 border-b border-[#e6ebf4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-cyan-600" />
            <div>
              <h2 className="text-lg font-semibold text-[#0c111d]">푸시 알림</h2>
              <p className="text-sm text-[#4562a1]">브라우저 푸시 알림 설정</p>
            </div>
          </div>
          <Badge className="bg-gray-100 text-gray-500 border-gray-200">
            준비 중
          </Badge>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {pushOptions.map(renderOption)}
          </div>
        </div>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#4562a1] hover:bg-[#3a5289]"
        >
          {saving ? '저장 중...' : '변경사항 저장'}
        </Button>
      </div>

      {/* 안내 카드 */}
      <Card className="p-6 bg-[#f0f4ff] border-[#cdd6ea]">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-[#4562a1]" />
          </div>
          <div>
            <h4 className="font-semibold text-[#0c111d] mb-1">알림 설정 안내</h4>
            <p className="text-sm text-[#4562a1]">
              이메일 알림은 가입 시 사용한 이메일 주소로 발송됩니다.
              중요한 알림은 발행 실패, 사용량 한도 도달 등 서비스 이용에 영향을 주는 내용입니다.
              필요한 알림만 활성화하여 효율적으로 관리하세요.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

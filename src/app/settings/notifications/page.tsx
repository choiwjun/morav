'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, Mail, CheckCircle, XCircle, AlertTriangle, CreditCard } from 'lucide-react';

interface NotificationSettings {
  email_on_publish_success: boolean;
  email_on_publish_fail: boolean;
  email_on_subscription_change: boolean;
  email_on_usage_limit: boolean;
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_on_publish_success: true,
    email_on_publish_fail: true,
    email_on_subscription_change: true,
    email_on_usage_limit: true,
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

  const notificationOptions = [
    {
      key: 'email_on_publish_success' as const,
      icon: CheckCircle,
      iconColor: 'text-green-500',
      title: '발행 성공 알림',
      description: '포스트가 블로그에 성공적으로 발행되면 이메일로 알려드립니다.',
    },
    {
      key: 'email_on_publish_fail' as const,
      icon: XCircle,
      iconColor: 'text-red-500',
      title: '발행 실패 알림',
      description: '포스트 발행에 실패하면 이메일로 알려드립니다.',
    },
    {
      key: 'email_on_subscription_change' as const,
      icon: CreditCard,
      iconColor: 'text-blue-500',
      title: '구독 변경 알림',
      description: '플랜 변경, 결제 완료 등 구독 상태가 변경되면 이메일로 알려드립니다.',
    },
    {
      key: 'email_on_usage_limit' as const,
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      title: '사용량 한도 알림',
      description: '월 발행 한도에 가까워지거나 도달하면 이메일로 알려드립니다.',
    },
  ];

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">알림 설정</h1>
        </div>
        <p className="text-gray-500">이메일 알림 수신 여부를 설정하세요</p>
      </div>

      {/* 이메일 알림 설정 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Mail className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">이메일 알림</h2>
          </div>

          <div className="space-y-4">
            {notificationOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-start gap-4">
                    <IconComponent className={`w-6 h-6 ${option.iconColor} flex-shrink-0 mt-0.5`} />
                    <div>
                      <p className="font-medium text-gray-900">{option.title}</p>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(option.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings[option.key] ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings[option.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : '변경사항 저장'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/dashboard';
import { toast } from 'sonner';

interface BillingHistoryItem {
  id: string;
  orderId: string;
  planName: string;
  amount: number;
  status: 'completed' | 'failed' | 'refunded';
  createdAt: string;
  paidAt: string | null;
}

interface BillingHistoryResponse {
  success: boolean;
  history?: BillingHistoryItem[];
  error?: string;
}

interface BillingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 날짜 포맷팅 (예: "2026-02-01")
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    completed: '완료',
    failed: '실패',
    refunded: '환불됨',
  };
  return labels[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'text-green-600 bg-green-50',
    failed: 'text-red-600 bg-red-50',
    refunded: 'text-gray-600 bg-gray-50',
  };
  return colors[status] || 'text-gray-600 bg-gray-50';
}

export function BillingHistoryModal({ isOpen, onClose }: BillingHistoryModalProps) {
  const [history, setHistory] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      // TODO: 결제 내역 API 구현 후 실제 API 호출
      // const response = await fetch('/api/payment/history');
      // const data: BillingHistoryResponse = await response.json();

      // 임시 데이터 (API 구현 전)
      const data: BillingHistoryResponse = {
        success: true,
        history: [],
      };

      if (!data.success) {
        toast.error(data.error || '결제 내역을 불러올 수 없습니다.');
        return;
      }

      setHistory(data.history || []);
    } catch (error) {
      console.error('Load billing history error:', error);
      toast.error('결제 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <Card
        className="p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">결제 내역</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">결제 내역을 불러오는 중...</p>
            </div>
          </div>
        ) : history.length === 0 ? (
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">결제 내역이 없습니다.</p>
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          </CardContent>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold mb-1">{item.planName}</h3>
                    <p className="text-sm text-gray-500">주문번호: {item.orderId}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>결제일: {item.paidAt ? formatDate(item.paidAt) : '-'}</p>
                    <p>생성일: {formatDateTime(item.createdAt)}</p>
                  </div>
                  <p className="text-xl font-bold">₩{item.amount.toLocaleString()}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

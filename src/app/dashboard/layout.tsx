'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  BarChart,
  Settings,
  CreditCard,
  LogOut,
  User,
} from 'lucide-react';
import { logout } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';

interface NavItemProps {
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  children: React.ReactNode;
}

function NavItem({ icon, href, active, children }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${
          active
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      <span className="w-5 h-5">{icon}</span>
      {children}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string | null; email: string | undefined } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          router.push('/auth/login');
          return;
        }

        // users 테이블에서 프로필 정보 가져오기
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', authUser.id)
          .single();

        if (profileError) {
          console.error('Load profile error:', profileError);
          // 프로필 조회 실패 시에도 기본 정보는 표시
          setUser({
            name: null,
            email: authUser.email,
          });
        } else {
          setUser({
            name: profile?.name || null,
            email: authUser.email,
          });
        }
      } catch (error) {
        console.error('Load user error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push('/auth/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <nav className="fixed left-0 top-0 w-64 h-screen bg-white border-r z-40 flex flex-col">
        {/* 로고 */}
        <div className="p-6 border-b">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            모라브
          </Link>
        </div>

        {/* 메뉴 */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} href="/dashboard" active={pathname === '/dashboard'}>
            대시보드
          </NavItem>
          <NavItem
            icon={<FileText size={20} />}
            href="/dashboard/posts"
            active={pathname === '/dashboard/posts'}
          >
            발행 관리
          </NavItem>
          <NavItem
            icon={<TrendingUp size={20} />}
            href="/dashboard/keywords"
            active={pathname === '/dashboard/keywords'}
          >
            키워드 탐색
          </NavItem>
          <NavItem
            icon={<BarChart size={20} />}
            href="/dashboard/analytics"
            active={pathname === '/dashboard/analytics'}
          >
            분석 리포트
          </NavItem>

          <div className="border-t my-4"></div>

          <NavItem
            icon={<Settings size={20} />}
            href="/settings"
            active={pathname?.startsWith('/settings')}
          >
            설정
          </NavItem>
          <NavItem
            icon={<CreditCard size={20} />}
            href="/payment/plans"
            active={pathname?.startsWith('/payment')}
          >
            요금제
          </NavItem>
        </div>

        {/* 하단 사용자 정보 */}
        <div className="p-4 border-t">
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-900">
                  {user.name || '사용자'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="로그아웃"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : null}
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="ml-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

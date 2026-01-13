'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Menu,
  X,
  UserCircle,
  Globe,
  Key,
  CreditCard as CreditCardIcon,
  Bell,
  Sparkles,
} from 'lucide-react';
import { logout } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';

interface NavItemProps {
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

function NavItem({ icon, href, active, children, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
        ${
          active
            ? 'bg-primary/10 text-primary'
            : 'text-[#4562a1] hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      <span className="w-5 h-5">{icon}</span>
      {children}
    </Link>
  );
}

interface SettingsNavItemProps {
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

function SettingsNavItem({ icon, href, active, children, onClick }: SettingsNavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
        ${
          active
            ? 'bg-[#4562a1]/10 text-[#4562a1] border-l-4 border-[#4562a1]'
            : 'text-[#0c111d] hover:bg-[#f0f4ff]'
        }
      `}
    >
      <span className="w-5 h-5">{icon}</span>
      {children}
    </Link>
  );
}

export default function SettingsLayout({
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 모바일 메뉴 닫기
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // 페이지 이동 시 모바일 메뉴 닫기
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  // 모바일 메뉴 열릴 때 스크롤 막기
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

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
    closeMobileMenu();
    const result = await logout();
    if (result.success) {
      router.push('/auth/login');
    }
  };

  // 사이드바 내용 컴포넌트
  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      {/* 로고 */}
      <div className="p-4 sm:p-6 border-b border-[#e6ebf4]">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavClick}>
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <LayoutDashboard size={18} />
          </div>
          <span className="text-xl font-bold text-[#0c111d]">Morav</span>
        </Link>
      </div>

      {/* 메뉴 */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <NavItem
          icon={<LayoutDashboard size={20} />}
          href="/dashboard"
          onClick={onNavClick}
        >
          대시보드
        </NavItem>
        <NavItem
          icon={<FileText size={20} />}
          href="/dashboard/posts"
          onClick={onNavClick}
        >
          발행 관리
        </NavItem>
        <NavItem
          icon={<TrendingUp size={20} />}
          href="/dashboard/keywords"
          onClick={onNavClick}
        >
          키워드 탐색
        </NavItem>
        <NavItem
          icon={<BarChart size={20} />}
          href="/dashboard/analytics"
          onClick={onNavClick}
        >
          분석 리포트
        </NavItem>

        <div className="border-t border-[#e6ebf4] my-4"></div>

        <NavItem
          icon={<Settings size={20} />}
          href="/settings"
          active={pathname?.startsWith('/settings')}
          onClick={onNavClick}
        >
          설정
        </NavItem>
        <NavItem
          icon={<CreditCard size={20} />}
          href="/payment/plans"
          active={pathname?.startsWith('/payment')}
          onClick={onNavClick}
        >
          요금제
        </NavItem>
      </div>

      {/* 하단 사용자 정보 */}
      <div className="p-4 border-t border-[#e6ebf4]">
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
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[#0c111d]">
                {user.name || '사용자'}
              </p>
              <p className="text-xs text-[#4562a1] truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-[#4562a1] hover:text-red-500 transition-colors"
              aria-label="로그아웃"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : null}
      </div>
    </>
  );

  // 설정 서브 네비게이션
  const SettingsSubNav = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div className="bg-white rounded-xl border border-[#cdd6ea] shadow-sm p-4">
      <h3 className="text-sm font-semibold text-[#0c111d] mb-4 px-4">설정 메뉴</h3>
      <div className="space-y-1">
        <SettingsNavItem
          icon={<UserCircle size={20} />}
          href="/settings/profile"
          active={pathname === '/settings/profile'}
          onClick={onNavClick}
        >
          프로필
        </SettingsNavItem>
        <SettingsNavItem
          icon={<Globe size={20} />}
          href="/settings/blogs"
          active={pathname === '/settings/blogs'}
          onClick={onNavClick}
        >
          블로그 관리
        </SettingsNavItem>
        <SettingsNavItem
          icon={<Key size={20} />}
          href="/settings/api-keys"
          active={pathname === '/settings/api-keys'}
          onClick={onNavClick}
        >
          API 키 관리
        </SettingsNavItem>
        <SettingsNavItem
          icon={<CreditCardIcon size={20} />}
          href="/settings/subscription"
          active={pathname === '/settings/subscription'}
          onClick={onNavClick}
        >
          구독 플랜
        </SettingsNavItem>
        <SettingsNavItem
          icon={<Bell size={20} />}
          href="/settings/notifications"
          active={pathname === '/settings/notifications'}
          onClick={onNavClick}
        >
          알림 설정
        </SettingsNavItem>
        <SettingsNavItem
          icon={<Sparkles size={20} />}
          href="/settings/auto-generate"
          active={pathname === '/settings/auto-generate'}
          onClick={onNavClick}
        >
          자동 생성
        </SettingsNavItem>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9fafa]">
      {/* 모바일 헤더 */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#e6ebf4] z-50 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="size-7 bg-primary rounded-lg flex items-center justify-center text-white">
            <LayoutDashboard size={16} />
          </div>
          <span className="text-lg font-bold text-[#0c111d]">Morav</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#4562a1] hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* 모바일 메뉴 오버레이 */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* 모바일 사이드바 (슬라이드) */}
      <nav
        className={`
          lg:hidden fixed top-14 left-0 w-72 h-[calc(100vh-3.5rem)] bg-white z-50
          flex flex-col transform transition-transform duration-300 ease-in-out overflow-y-auto
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent onNavClick={closeMobileMenu} />
        <div className="p-4 border-t border-[#e6ebf4]">
          <SettingsSubNav onNavClick={closeMobileMenu} />
        </div>
      </nav>

      {/* 데스크탑 사이드바 (고정) */}
      <nav className="hidden lg:flex fixed left-0 top-0 w-64 h-screen bg-white border-r border-[#e6ebf4] z-40 flex-col">
        <SidebarContent />
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Sticky 헤더 */}
          <div className="sticky top-14 lg:top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-[#f9fafa]/95 backdrop-blur-sm border-b border-[#e6ebf4] mb-6">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-[#4562a1]" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0c111d]">설정</h1>
                <p className="text-sm text-[#4562a1]">계정 및 서비스 설정을 관리하세요</p>
              </div>
            </div>
          </div>

          {/* 설정 콘텐츠 레이아웃 */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 데스크탑: 좌측 서브 네비게이션 */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-32">
                <SettingsSubNav />
              </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

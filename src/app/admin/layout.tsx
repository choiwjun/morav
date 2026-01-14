'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  ArrowLeft,
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
            ? 'bg-red-500/10 text-red-600'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      <span className="w-5 h-5">{icon}</span>
      {children}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ email: string | undefined } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

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
    const checkAdmin = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          router.push('/auth/login');
          return;
        }

        // 환경변수에서 관리자 이메일 확인 (클라이언트에서는 API 호출)
        const response = await fetch('/api/admin/check');
        const data = await response.json();

        // 디버깅용 로그
        console.log('[Admin Layout] Check response:', data);

        if (!data.isAdmin) {
          console.log('[Admin Layout] Not admin, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        setUser({ email: authUser.email });
        setIsAdmin(true);
      } catch (error) {
        console.error('Admin check error:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  const handleLogout = async () => {
    closeMobileMenu();
    const result = await logout();
    if (result.success) {
      router.push('/auth/login');
    }
  };

  // 로딩 중이거나 관리자가 아니면 빈 화면
  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      {/* 로고 */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <Link href="/admin" className="flex items-center gap-2" onClick={onNavClick}>
          <div className="size-8 bg-red-500 rounded-lg flex items-center justify-center text-white">
            <Shield size={18} />
          </div>
          <span className="text-xl font-bold text-gray-900">Admin</span>
        </Link>
      </div>

      {/* 메뉴 */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <NavItem
          icon={<LayoutDashboard size={20} />}
          href="/admin"
          active={pathname === '/admin'}
          onClick={onNavClick}
        >
          대시보드
        </NavItem>
        <NavItem
          icon={<Users size={20} />}
          href="/admin/users"
          active={pathname === '/admin/users'}
          onClick={onNavClick}
        >
          사용자 관리
        </NavItem>
        <NavItem
          icon={<CreditCard size={20} />}
          href="/admin/subscriptions"
          active={pathname === '/admin/subscriptions'}
          onClick={onNavClick}
        >
          구독 관리
        </NavItem>
        <NavItem
          icon={<FileText size={20} />}
          href="/admin/posts"
          active={pathname === '/admin/posts'}
          onClick={onNavClick}
        >
          콘텐츠 모니터링
        </NavItem>
        <NavItem
          icon={<Settings size={20} />}
          href="/admin/system"
          active={pathname === '/admin/system'}
          onClick={onNavClick}
        >
          시스템 현황
        </NavItem>

        <div className="border-t border-gray-200 my-4"></div>

        <NavItem
          icon={<ArrowLeft size={20} />}
          href="/dashboard"
          onClick={onNavClick}
        >
          사용자 대시보드
        </NavItem>
      </div>

      {/* 하단 사용자 정보 */}
      <div className="p-4 border-t border-gray-200">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <Shield size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">관리자</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
              aria-label="로그아웃"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 헤더 */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="size-7 bg-red-500 rounded-lg flex items-center justify-center text-white">
            <Shield size={16} />
          </div>
          <span className="text-lg font-bold text-gray-900">Admin</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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

      {/* 모바일 사이드바 */}
      <nav
        className={`
          lg:hidden fixed top-14 left-0 w-72 h-[calc(100vh-3.5rem)] bg-white z-50
          flex flex-col transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent onNavClick={closeMobileMenu} />
      </nav>

      {/* 데스크탑 사이드바 */}
      <nav className="hidden lg:flex fixed left-0 top-0 w-64 h-screen bg-white border-r border-gray-200 z-40 flex-col">
        <SidebarContent />
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="lg:ml-64 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}

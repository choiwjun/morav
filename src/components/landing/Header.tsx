'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl">
      <div className="max-w-[1040px] mx-auto px-6 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary">
            Morav
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          <Link
            className="text-[15px] font-medium text-toss-gray-600 hover:text-primary transition-colors"
            href="#features"
          >
            기능
          </Link>
          <Link
            className="text-[15px] font-medium text-toss-gray-600 hover:text-primary transition-colors"
            href="#how-it-works"
          >
            방법
          </Link>
          <Link
            className="text-[15px] font-medium text-toss-gray-600 hover:text-primary transition-colors"
            href="#pricing"
          >
            요금제
          </Link>
          <Link
            className="text-[15px] font-medium text-toss-gray-600 hover:text-primary transition-colors"
            href="#faq"
          >
            FAQ
          </Link>
        </nav>

        {/* Desktop Login Button */}
        <Link
          href="/auth/login"
          className="hidden md:block bg-toss-gray-50 text-toss-gray-700 px-4 py-2 rounded-toss-sm text-[14px] font-bold hover:bg-toss-gray-100 transition-all"
        >
          로그인
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-toss-gray-700"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="메뉴 열기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden bg-white border-t border-toss-gray-100 shadow-lg">
          <div className="px-6 py-4 flex flex-col gap-4">
            <Link
              className="text-[15px] font-medium text-toss-gray-600 hover:text-primary transition-colors py-2"
              href="#features"
              onClick={() => setIsMenuOpen(false)}
            >
              기능
            </Link>
            <Link
              className="text-[15px] font-medium text-toss-gray-600 hover:text-primary transition-colors py-2"
              href="#how-it-works"
              onClick={() => setIsMenuOpen(false)}
            >
              방법
            </Link>
            <Link
              className="text-[15px] font-medium text-toss-gray-600 hover:text-primary transition-colors py-2"
              href="#pricing"
              onClick={() => setIsMenuOpen(false)}
            >
              요금제
            </Link>
            <Link
              className="text-[15px] font-medium text-toss-gray-600 hover:text-primary transition-colors py-2"
              href="#faq"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQ
            </Link>
            <hr className="border-toss-gray-100" />
            <Link
              href="/auth/login"
              className="bg-primary text-white px-4 py-3 rounded-toss-sm text-[14px] font-bold text-center hover:brightness-110 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              로그인
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

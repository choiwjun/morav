'use client';

import Link from 'next/link';

const footerLinks = {
  product: [
    { name: '주요 기능', href: '#features' },
    { name: '요금제', href: '#pricing' },
  ],
  company: [
    { name: '회사 소개', href: '#' },
    { name: '공식 블로그', href: '#' },
  ],
  legal: [
    { name: '개인정보 처리방침', href: '#' },
    { name: '이용 약관', href: '#' },
  ],
  support: [
    { name: '개인정보 처리방침', href: '#' },
    { name: '이용 약관', href: '#' },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 sm:py-20 border-t border-toss-gray-100">
      <div className="max-w-[1040px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12 lg:mb-16">
          <div className="col-span-2 md:col-span-1">
            <h2 className="text-lg sm:text-xl font-bold text-primary mb-4 sm:mb-6">
              Morav
            </h2>
            <p className="text-xs sm:text-sm text-toss-gray-600 font-medium leading-relaxed">
              블로그 관리의 새로운 기준,<br />
              AI 기반 통합 솔루션 모라브
            </p>
          </div>
          <div>
            <h6 className="font-bold text-toss-gray-800 mb-4 sm:mb-6 text-xs sm:text-sm">제품</h6>
            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-toss-gray-600 font-medium">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h6 className="font-bold text-toss-gray-800 mb-4 sm:mb-6 text-xs sm:text-sm">회사</h6>
            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-toss-gray-600 font-medium">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h6 className="font-bold text-toss-gray-800 mb-4 sm:mb-6 text-xs sm:text-sm">고객 지원</h6>
            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-toss-gray-600 font-medium">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pt-6 sm:pt-8 border-t border-toss-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-toss-gray-200 font-medium">
          <p className="text-toss-gray-600 text-center sm:text-left">
            © {currentYear} Morav AI Inc. All rights reserved.
          </p>
          <div className="flex gap-4 sm:gap-6">
            <a
              href="#"
              className="text-toss-gray-600 hover:text-primary transition-colors text-xs sm:text-sm"
            >
              인스타그램
            </a>
            <a
              href="#"
              className="text-toss-gray-600 hover:text-primary transition-colors text-xs sm:text-sm"
            >
              유튜브
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

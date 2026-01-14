'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const blogOptions = [1, 2, 3] as const;
type BlogCount = (typeof blogOptions)[number];

const plans = [
  {
    name: '무료 체험',
    prices: { 1: 0, 2: 0, 3: 0 },
    posts: '총 5건',
    features: ['블로그 1개 연동', '5건 발행 무제한 기간'],
    cta: '지금 시작하기',
    popular: false,
    fixedBlog: true,
  },
  {
    name: '라이트',
    prices: { 1: 19000, 2: 29000, 3: 39000 },
    posts: '월 50건',
    features: ['카테고리 필터링', 'AI 콘텐츠 자동 생성', '예약 발행 스케줄링'],
    cta: '선택하기',
    popular: true,
    fixedBlog: false,
  },
  {
    name: '스탠다드',
    prices: { 1: 39000, 2: 59000, 3: 79000 },
    posts: '월 200건',
    features: ['라이트 기능 전체', '우선 지원'],
    cta: '선택하기',
    popular: false,
    fixedBlog: false,
  },
  {
    name: '프로',
    prices: { 1: 69000, 2: 99000, 3: 129000 },
    posts: '월 500건',
    features: ['스탠다드 기능 전체', '프리미엄 지원'],
    cta: '선택하기',
    popular: false,
    fixedBlog: false,
  },
  {
    name: '언리미티드',
    prices: { 1: 99000, 2: 149000, 3: 199000 },
    posts: '무제한',
    features: ['프로 기능 전체', '무제한 발행'],
    cta: '선택하기',
    popular: false,
    fixedBlog: false,
  },
];

export default function Pricing() {
  const [blogCount, setBlogCount] = useState<BlogCount>(1);

  const formatPrice = (price: number) => {
    if (price === 0) return '무료';
    return `₩${price.toLocaleString()}`;
  };

  return (
    <section className="section-padding" id="pricing">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="text-[28px] sm:text-[32px] lg:text-[40px] font-bold tracking-tight text-toss-gray-800">
            합리적인 플랜
          </h2>
          <p className="text-toss-gray-600 mt-4 font-medium">
            블로그 수에 따라 유연하게 선택하세요
          </p>
        </div>

        {/* Blog count selector */}
        <div className="flex justify-center mb-8 lg:mb-12">
          <div className="inline-flex bg-toss-gray-50 rounded-toss-md p-1">
            {blogOptions.map((count) => (
              <button
                key={count}
                onClick={() => setBlogCount(count)}
                className={`px-4 sm:px-6 py-2 rounded-toss-sm text-sm font-bold transition-all ${
                  blogCount === count
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-toss-gray-600 hover:text-toss-gray-800'
                }`}
              >
                {count}개 블로그
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`p-5 sm:p-6 bg-white rounded-toss-lg flex flex-col ${
                plan.popular
                  ? 'border-2 border-primary shadow-lg lg:scale-[1.02] z-10 relative'
                  : 'border border-toss-gray-100'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                  BEST
                </div>
              )}

              <h5
                className={`font-bold mb-2 text-sm ${plan.popular ? 'text-primary' : 'text-toss-gray-600'}`}
              >
                {plan.name}
              </h5>
              <div className="text-[24px] sm:text-[28px] font-bold mb-1 text-toss-gray-800">
                {formatPrice(plan.prices[plan.fixedBlog ? 1 : blogCount])}
              </div>
              <div className="text-xs text-toss-gray-400 mb-4">
                {plan.prices[1] > 0 ? '/월' : ''} · {plan.posts}
              </div>
              <ul className="space-y-2 mb-6 text-[12px] sm:text-[13px] font-medium text-toss-gray-700 flex-1">
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-primary flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {plan.fixedBlog ? '블로그 1개' : `블로그 ${blogCount}개`}
                </li>
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-primary flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`w-full py-2.5 rounded-toss-md font-bold text-sm ${
                  plan.popular
                    ? 'bg-primary text-white shadow-toss-button hover:brightness-110 transition-all'
                    : 'bg-toss-gray-50 text-toss-gray-700 hover:bg-toss-gray-100 transition-colors border-transparent'
                }`}
              >
                <Link href="/auth/signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-toss-gray-400 mt-8">
          모든 유료 플랜: 실시간 인기 키워드 DB 접근 · 카테고리별 필터링 · AI 콘텐츠 자동 생성 (사용자 BYOK) · 구글블로그/워드프레스
        </p>
      </div>
    </section>
  );
}

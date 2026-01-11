'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '0',
    description: '블로그 자동화를 체험해보세요',
    posts: '월 5개',
    features: ['기본 AI 콘텐츠 생성', '1개 블로그 연결', '기본 트렌드 키워드', '이메일 지원'],
    cta: '무료로 시작',
    popular: false,
  },
  {
    name: 'Light',
    price: '9,900',
    description: '개인 블로거에게 적합',
    posts: '월 30개',
    features: [
      '고급 AI 콘텐츠 생성',
      '3개 블로그 연결',
      '실시간 트렌드 키워드',
      '예약 발행',
      '우선 이메일 지원',
    ],
    cta: '시작하기',
    popular: false,
  },
  {
    name: 'Standard',
    price: '19,900',
    description: '전문 블로거에게 추천',
    posts: '월 100개',
    features: [
      '프리미엄 AI 콘텐츠 생성',
      '5개 블로그 연결',
      '실시간 트렌드 키워드',
      '예약 발행',
      'AI 이미지 생성',
      '우선 지원',
    ],
    cta: '시작하기',
    popular: true,
  },
  {
    name: 'Pro',
    price: '39,900',
    description: '파워 블로거를 위한 플랜',
    posts: '월 300개',
    features: [
      '최고급 AI 콘텐츠 생성',
      '10개 블로그 연결',
      '실시간 트렌드 키워드',
      '예약 발행',
      'AI 이미지 생성',
      '전용 지원',
      'API 접근',
    ],
    cta: '시작하기',
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            합리적인 요금제
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            필요에 맞는 플랜을 선택하세요. 언제든지 업그레이드할 수 있습니다.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl p-8 shadow-sm border-2 ${
                plan.popular ? 'border-blue-500' : 'border-gray-100'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-sm font-medium px-4 py-1 rounded-full">
                    가장 인기
                  </span>
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-gray-500 text-sm mt-1">{plan.description}</p>

              {/* Price */}
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price === '0' ? '무료' : `₩${plan.price}`}
                </span>
                {plan.price !== '0' && <span className="text-gray-500">/월</span>}
              </div>

              {/* Posts per month */}
              <div className="mt-4 text-sm font-medium text-blue-600">{plan.posts} 발행</div>

              {/* Features */}
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                asChild
                className={`w-full mt-8 ${plan.popular ? '' : 'bg-gray-900 hover:bg-gray-800'}`}
                variant={plan.popular ? 'default' : 'outline'}
              >
                <Link href="/auth/signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Enterprise note */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            더 많은 발행이 필요하신가요?{' '}
            <Link href="/payment/plans" className="text-blue-600 font-medium hover:underline">
              Unlimited 플랜
            </Link>
            을 확인해보세요.
          </p>
        </div>
      </div>
    </section>
  );
}

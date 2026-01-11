'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Zap, Clock } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 sm:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl opacity-30">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-500 to-purple-500" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
            <Sparkles size={16} />
            AI 기반 블로그 자동화 플랫폼
          </div>

          {/* Main heading */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            블로그 운영,
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI가 대신합니다
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg leading-8 text-gray-600">
            트렌드 키워드 분석부터 콘텐츠 생성, 자동 발행까지.
            <br />
            모라브와 함께라면 하루 5분이면 충분합니다.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/auth/signup">
                무료로 시작하기
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#how-it-works">어떻게 작동하나요?</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-blue-600">
                <Zap size={24} />
                <span className="text-3xl font-bold">10분</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">평균 콘텐츠 생성 시간</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-blue-600">
                <Clock size={24} />
                <span className="text-3xl font-bold">24/7</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">자동 발행 시스템</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-blue-600">
                <Sparkles size={24} />
                <span className="text-3xl font-bold">1,500+</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">자 이상 고품질 콘텐츠</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <section className="section-padding overflow-hidden">
      <div className="max-w-[1040px] mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="flex flex-col gap-8 lg:gap-10">
          <div className="flex flex-col gap-4">
            <h1 className="text-[36px] sm:text-[44px] lg:text-[56px] font-bold leading-[1.3] tracking-tighter text-toss-gray-800">
              블로그 관리는 이제 <br />
              <span className="text-primary">모라브</span>에게 맡기세요
            </h1>
            <p className="text-lg lg:text-xl text-toss-gray-600 leading-relaxed font-medium">
              소재 고갈 걱정 없는 고품질 포스팅 관리.<br />
              네이버, 티스토리, 워드프레스 통합 솔루션.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="bg-primary text-white px-6 sm:px-8 py-4 rounded-toss-md font-bold text-base lg:text-lg hover:brightness-110 transition-all shadow-toss-button w-full sm:w-auto"
              >
                <Link href="/auth/signup">무료로 시작하기</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="bg-toss-gray-50 text-toss-gray-700 px-6 sm:px-8 py-4 rounded-toss-md font-bold text-base lg:text-lg hover:bg-toss-gray-100 transition-all border-transparent w-full sm:w-auto"
              >
                <Link href="#how-it-works">서비스 안내</Link>
              </Button>
            </div>
            <p className="text-sm text-toss-gray-600 font-medium">
              <span className="text-primary">&#10003;</span> 5건 무료 발행 제공 &nbsp;&nbsp;
              <span className="text-primary">&#10003;</span> 신용카드 불필요
            </p>
          </div>
        </div>
        <div className="relative">
          <div className="relative bg-toss-gray-50 rounded-toss-xl p-3 sm:p-4 overflow-hidden shadow-toss-card border border-toss-gray-100">
            <img
              alt="대시보드 미리보기"
              className="rounded-toss-lg shadow-sm w-full"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_uooip_oGJgoreO9HbJWLJMqyoM1dHFYJv4MwEuVVUIIX1r0pbpcBCqvdVJmdkj_p5reJbEMGlGJ3iUrqtcZl6iwVH4MskyR12x0gzkwP6viINT9EUPjlVcxKVZRnHOTFrOukOo1DHtK5Stq2iNRLcQWmyU1qcG91ryQIP2NK9IaWkp0bnJXQlkZyxkF7Kst1SmERQ-6eQGXcH8nnNnygATH3IH2E3fKttmp2qkn-237hzZxSwg0R97f3T7XMfYJAYzmw0FZnngw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FinalCTA() {
  return (
    <section className="section-padding">
      <div className="max-w-[1040px] mx-auto px-6">
        <div className="rounded-toss-xl bg-toss-gray-50 p-8 sm:p-12 lg:p-16 xl:p-24 text-center">
          <h2 className="text-[28px] sm:text-[36px] lg:text-[40px] xl:text-[52px] font-bold mb-6 sm:mb-8 tracking-tight text-toss-gray-800">
            지금 바로 시작해보세요
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-toss-gray-600 font-medium mb-8 sm:mb-12">
            카드 등록 없이 1분이면 첫 포스팅이 가능합니다.
          </p>
          <Button
            asChild
            className="bg-primary text-white px-8 sm:px-12 py-4 sm:py-5 rounded-toss-md font-bold text-base sm:text-xl hover:brightness-110 transition-all shadow-toss-button w-full sm:w-auto"
          >
            <Link href="/auth/signup">무료로 시작하기</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

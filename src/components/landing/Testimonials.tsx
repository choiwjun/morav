'use client';

export default function Testimonials() {
  return (
    <section className="section-padding bg-toss-gray-800 text-white">
      <div className="max-w-[1040px] mx-auto px-6">
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-lg sm:text-xl text-toss-gray-200 font-medium">이미 100명의 블로거가 사용 중</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 text-center mb-16 lg:mb-24">
          <div>
            <div className="text-[36px] sm:text-[42px] lg:text-[48px] font-bold mb-2">10,000+</div>
            <div className="text-toss-gray-200 font-medium text-sm sm:text-base">누적 자동 발행 콘텐츠</div>
          </div>
          <div>
            <div className="text-[36px] sm:text-[42px] lg:text-[48px] font-bold mb-2">+60%</div>
            <div className="text-toss-gray-200 font-medium text-sm sm:text-base">사용자 평균 블로그 유입 증가</div>
          </div>
          <div>
            <div className="text-[36px] sm:text-[42px] lg:text-[48px] font-bold mb-2">99.5%</div>
            <div className="text-toss-gray-200 font-medium text-sm sm:text-base">발행 성공률 (자동 재시도 포함)</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-toss-gray-700/50 p-6 sm:p-8 lg:p-10 rounded-toss-xl border border-white/10">
            <p className="text-base sm:text-lg lg:text-xl font-medium leading-relaxed mb-6 sm:mb-8 lg:mb-10">
              "모라브를 쓰고 저녁이 있는 삶을 되찾았어요. 출근길에 키워드만 입력해두면 알아서 다 되니까요."
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                alt="김민준"
                className="size-10 sm:size-12 rounded-full"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBt5zt0XFmL34fmGidQg0XyR5Vt5YLZuNSFAMOa0fCcXWnheu5iUzVljpmcXvnQ5RIOh_9hSlAUPuVFnzxAcK_aNZsiA7uA2dntU-AOvQZf3Xy5-2IOGohIvRXWrAyEEMpc2_Em9SX9Hb-gvy27dBS0AgQFATU6iTZnpx5CgSbANQGiA2RYmft6b-Fvnmg5Hff4f5xA2c5mc1e-nqU5d3d-vUxslQjhrjbyafX-GVW8LcKYJ3jXyhPiykjJcrEHnT80lxMSCuEBDDo"
              />
              <div>
                <div className="font-bold text-sm sm:text-base">김민준 님</div>
                <div className="text-xs sm:text-sm text-toss-gray-200">IT 테크 전문 블로거</div>
              </div>
            </div>
          </div>
          <div className="bg-toss-gray-700/50 p-6 sm:p-8 lg:p-10 rounded-toss-xl border border-white/10">
            <p className="text-base sm:text-lg lg:text-xl font-medium leading-relaxed mb-6 sm:mb-8 lg:mb-10">
              "수익형 블로그 10개 운영이 모라브 하나로 훨씬 쉬워졌습니다. SEO 기능은 정말 기대 이상이에요."
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                alt="이지은"
                className="size-10 sm:size-12 rounded-full"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzNYCYRC7T7_jj1vj7wGGQozgQrIlzhykV_X208Yfbo7tPnAuFyQHLf07wOZ9uIHr9lH_-ixuS1aDyVpIT8KtUb_G0wcnH7teeBgkkwKEmXQGvRtSYTiV0tmVOcSE4jqYqDFAbFX6ggPu1o6T_cw9F45NUiDNF95XPfxFHHCTvHbCAYTMp3SI_8g8j2KHl0cVoOlVIGc6KzI-puJyeG2eZzIujJfMs7JrCTWoZeWynw3xCL6t8i1Q0J80c1z0NkzuB7YiQr0FyumA"
              />
              <div>
                <div className="font-bold text-sm sm:text-base">이지은 님</div>
                <div className="text-xs sm:text-sm text-toss-gray-200">디지털 마케터</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

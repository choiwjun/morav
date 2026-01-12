'use client';

export default function ProblemSolution() {
  return (
    <section className="section-padding bg-toss-gray-50">
      <div className="max-w-[1040px] mx-auto px-6">
        <div className="text-center mb-12 lg:mb-20">
          <h2 className="text-[28px] sm:text-[32px] lg:text-[40px] font-bold mb-6 tracking-tight text-toss-gray-800">
            어렵고 번거로운 블로그 운영,<br />
            모라브는 다릅니다.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
          <div className="p-6 sm:p-8 lg:p-10 rounded-toss-xl bg-white border border-toss-gray-100 shadow-toss-card">
            <h3 className="text-lg sm:text-xl font-bold mb-6 sm:mb-10 text-toss-gray-600">
              이전의 고충
            </h3>
            <ul className="space-y-4 sm:space-y-6 lg:space-y-8">
              <li className="flex gap-3 sm:gap-4 items-start">
                <span className="text-toss-gray-200 text-xl sm:text-2xl flex-shrink-0">✕</span>
                <p className="text-sm sm:text-base text-toss-gray-600 font-medium leading-relaxed">
                  매일 어떤 주제로 글을 쓸지 반복되는 고민
                </p>
              </li>
              <li className="flex gap-3 sm:gap-4 items-start">
                <span className="text-toss-gray-200 text-xl sm:text-2xl flex-shrink-0">✕</span>
                <p className="text-sm sm:text-base text-toss-gray-600 font-medium leading-relaxed">
                  여러 플랫폼에 복사 붙여넣기하는 시간 낭비
                </p>
              </li>
              <li className="flex gap-3 sm:gap-4 items-start">
                <span className="text-toss-gray-200 text-xl sm:text-2xl flex-shrink-0">✕</span>
                <p className="text-sm sm:text-base text-toss-gray-600 font-medium leading-relaxed">
                  복잡한 SEO 최적화와 상위 노출의 어려움
                </p>
              </li>
            </ul>
          </div>
          <div className="p-6 sm:p-8 lg:p-10 rounded-toss-xl bg-white border border-toss-gray-100 shadow-toss-card">
            <h3 className="text-lg sm:text-xl font-bold mb-6 sm:mb-10 text-primary">
              모라브와 함께라면
            </h3>
            <ul className="space-y-4 sm:space-y-6 lg:space-y-8">
              <li className="flex gap-3 sm:gap-4 items-start">
                <span className="text-primary text-xl sm:text-2xl flex-shrink-0">✓</span>
                <p className="text-sm sm:text-base text-toss-gray-800 font-bold leading-relaxed">
                  AI가 실시간 트렌드를 분석해 소재 자동 추천
                </p>
              </li>
              <li className="flex gap-3 sm:gap-4 items-start">
                <span className="text-primary text-xl sm:text-2xl flex-shrink-0">✓</span>
                <p className="text-sm sm:text-base text-toss-gray-800 font-bold leading-relaxed">
                  클릭 한 번으로 모든 블로그 동시 발행
                </p>
              </li>
              <li className="flex gap-3 sm:gap-4 items-start">
                <span className="text-primary text-xl sm:text-2xl flex-shrink-0">✓</span>
                <p className="text-sm sm:text-base text-toss-gray-800 font-bold leading-relaxed">
                  검색 엔진 로직에 맞춘 완벽한 SEO 자동 작성
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

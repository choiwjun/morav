'use client';

export default function HowItWorks() {
  return (
    <section className="section-padding" id="how-it-works">
      <div className="max-w-[1040px] mx-auto px-6">
        <div className="text-center mb-12 lg:mb-20">
          <h2 className="text-[28px] sm:text-[32px] lg:text-[40px] font-bold tracking-tight text-toss-gray-800">
            3단계면 끝납니다
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-toss-gray-50 flex items-center justify-center text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-8 sm:h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl sm:text-2xl font-bold text-toss-gray-800">블로그 연동</h3>
              <p className="text-sm sm:text-base text-toss-gray-600 leading-relaxed font-medium">
                구글 블로거, 워드프레스 등 운영 중인 계정을 안전하게 연결하세요.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-toss-gray-50 flex items-center justify-center text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-8 sm:h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423z" />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl sm:text-2xl font-bold text-toss-gray-800">AI 콘텐츠 생성</h3>
              <p className="text-sm sm:text-base text-toss-gray-600 leading-relaxed font-medium">
                핵심 키워드만 입력하면 AI가 전문적인 초안을 생성합니다.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-toss-gray-50 flex items-center justify-center text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-8 sm:h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl sm:text-2xl font-bold text-toss-gray-800">스마트 예약 발행</h3>
              <p className="text-sm sm:text-base text-toss-gray-600 leading-relaxed font-medium">
                원하는 시간에 맞춰 스케줄에 따라 자동으로 업로드됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

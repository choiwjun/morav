'use client';

export default function Features() {
  return (
    <section className="section-padding bg-toss-gray-50" id="features">
      <div className="max-w-[1040px] mx-auto px-6">
        <div className="mb-12 lg:mb-20">
          <h2 className="text-[28px] sm:text-[32px] lg:text-[40px] font-bold tracking-tight text-toss-gray-800">
            성장을 위한 핵심 도구
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          <div className="p-6 sm:p-8 bg-white rounded-toss-lg shadow-toss-card border border-toss-gray-100 flex flex-col gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 sm:w-8 sm:h-8 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <h4 className="text-lg sm:text-[20px] font-bold text-toss-gray-800">통합 대시보드</h4>
            <p className="text-sm sm:text-[15px] text-toss-gray-600 leading-relaxed font-medium">
              여러 계정의 방문자와 댓글을 한곳에서 통합 관리하세요.
            </p>
          </div>
          <div className="p-6 sm:p-8 bg-white rounded-toss-lg shadow-toss-card border border-toss-gray-100 flex flex-col gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 sm:w-8 sm:h-8 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <h4 className="text-lg sm:text-[20px] font-bold text-toss-gray-800">AI 이미지 생성</h4>
            <p className="text-sm sm:text-[15px] text-toss-gray-600 leading-relaxed font-medium">
              본문 내용에 최적화된 고화질 썸네일을 AI가 제작합니다.
            </p>
          </div>
          <div className="p-6 sm:p-8 bg-white rounded-toss-lg shadow-toss-card border border-toss-gray-100 flex flex-col gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 sm:w-8 sm:h-8 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
            </svg>
            <h4 className="text-lg sm:text-[20px] font-bold text-toss-gray-800">스마트 SEO 진단</h4>
            <p className="text-sm sm:text-[15px] text-toss-gray-600 leading-relaxed font-medium">
              검색 엔진 상위 노출을 위해 글 구조를 실시간으로 분석합니다.
            </p>
          </div>
          <div className="p-6 sm:p-8 bg-white rounded-toss-lg shadow-toss-card border border-toss-gray-100 flex flex-col gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 sm:w-8 sm:h-8 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
            </svg>
            <h4 className="text-lg sm:text-[20px] font-bold text-toss-gray-800">대량 예약 시스템</h4>
            <p className="text-sm sm:text-[15px] text-toss-gray-600 leading-relaxed font-medium">
              한 달 치 포스팅 스케줄링을 단 5분 만에 완료할 수 있습니다.
            </p>
          </div>
          <div className="p-6 sm:p-8 bg-white rounded-toss-lg shadow-toss-card border border-toss-gray-100 flex flex-col gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 sm:w-8 sm:h-8 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
            <h4 className="text-lg sm:text-[20px] font-bold text-toss-gray-800">정밀 성과 리포트</h4>
            <p className="text-sm sm:text-[15px] text-toss-gray-600 leading-relaxed font-medium">
              유입 키워드와 성과 데이터를 그래프로 상세히 제공합니다.
            </p>
          </div>
          <div className="p-6 sm:p-8 bg-white rounded-toss-lg shadow-toss-card border border-toss-gray-100 flex flex-col gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 sm:w-8 sm:h-8 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
            </svg>
            <h4 className="text-lg sm:text-[20px] font-bold text-toss-gray-800">글로벌 멀티 플랫폼</h4>
            <p className="text-sm sm:text-[15px] text-toss-gray-600 leading-relaxed font-medium">
              국내 플랫폼부터 워드프레스, 구글 블로거까지 지원합니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

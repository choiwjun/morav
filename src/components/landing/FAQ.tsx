'use client';

import { useState } from 'react';

const faqs = [
  {
    question: '무료 체험은 어떻게 사용하나요?',
    answer:
      '회원가입 후 즉시 5건 발행을 무료로 사용할 수 있습니다. 시간 제한은 없으며, 신용카드 등록도 불필요합니다.',
  },
  {
    question: 'AI API 키는 어디서 발급받나요?',
    answer:
      'OpenAI, Claude, Gemini, Grok 각 플랫폼에서 직접 발급받으셔야 합니다. 설정 페이지에서 발급 가이드를 참고하세요.',
  },
  {
    question: 'AI 생성 콘텐츠로 애드센스 승인 가능한가요?',
    answer:
      '네, 모라브는 1500자 이상, SEO 최적화된 콘텐츠를 생성하도록 설계되었습니다. 다만 최종 승인은 구글 정책에 따라 다를 수 있습니다.',
  },
  {
    question: '네이버 블로그는 지원하나요?',
    answer:
      '현재는 티스토리, 구글 블로그, 워드프레스만 지원합니다. 네이버 블로그는 향후 업데이트 예정입니다.',
  },
  {
    question: '환불 정책은 어떻게 되나요?',
    answer:
      '구독 후 7일 이내 100% 환불 가능합니다. 발행 건수를 사용하지 않은 경우에 한합니다.',
  },
  {
    question: '블로그를 나중에 추가할 수 있나요?',
    answer:
      '네, 언제든지 대시보드에서 블로그를 추가하거나 제거할 수 있습니다. 단, 플랜별 최대 블로그 수 제한이 있습니다.',
  },
  {
    question: '발행 시간을 자유롭게 설정할 수 있나요?',
    answer:
      '네, 원하는 시간대(예: 매일 오전 9시)와 요일(월~일 선택)을 자유롭게 설정할 수 있습니다.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="section-padding" id="faq">
      <div className="max-w-[700px] mx-auto px-6">
        <h2 className="text-[28px] sm:text-[32px] font-bold mb-8 sm:mb-12 text-center text-toss-gray-800">
          자주 묻는 질문
        </h2>
        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group bg-white rounded-toss-lg border border-toss-gray-100 shadow-toss-card"
              open={openIndex === index}
            >
              <summary
                className="flex items-center justify-between p-4 sm:p-6 cursor-pointer list-none font-bold text-base sm:text-[18px] text-toss-gray-800"
                onClick={(e) => {
                  e.preventDefault();
                  toggleFaq(index);
                }}
              >
                {faq.question}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`w-5 h-5 transition-transform text-toss-gray-200 flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              {openIndex === index && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-sm sm:text-base text-toss-gray-600 font-medium leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

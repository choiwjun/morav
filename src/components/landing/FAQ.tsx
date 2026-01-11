'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: '모라브는 어떤 서비스인가요?',
    answer:
      '모라브는 AI를 활용한 블로그 자동화 플랫폼입니다. 트렌드 키워드 수집부터 콘텐츠 생성, 자동 발행까지 블로그 운영에 필요한 모든 과정을 자동화해 드립니다.',
  },
  {
    question: '어떤 블로그 플랫폼을 지원하나요?',
    answer:
      '현재 티스토리, 구글 블로거, 워드프레스를 지원합니다. 추후 네이버 블로그 등 더 많은 플랫폼을 지원할 예정입니다.',
  },
  {
    question: '어떤 AI 모델을 사용할 수 있나요?',
    answer:
      'OpenAI(GPT-4, GPT-3.5), Anthropic Claude, Google Gemini, Grok 등 주요 AI 모델을 지원합니다. 원하는 AI 서비스의 API 키를 등록하면 바로 사용할 수 있습니다.',
  },
  {
    question: 'API 키는 안전하게 보관되나요?',
    answer:
      '네, 모든 API 키는 AES-256 암호화로 안전하게 저장됩니다. 암호화된 키는 복호화 없이는 읽을 수 없으며, 서비스 외 용도로 사용되지 않습니다.',
  },
  {
    question: '생성된 콘텐츠의 품질은 어떤가요?',
    answer:
      '평균 1,500자 이상의 고품질 콘텐츠가 생성됩니다. 트렌드 키워드를 기반으로 SEO에 최적화된 글이 작성되며, 필요에 따라 수정 후 발행할 수 있습니다.',
  },
  {
    question: '무료 플랜의 제한은 무엇인가요?',
    answer:
      '무료 플랜에서는 월 5개의 포스트를 발행할 수 있으며, 1개의 블로그만 연결 가능합니다. 더 많은 기능이 필요하시면 유료 플랜으로 업그레이드해 주세요.',
  },
  {
    question: '언제든지 구독을 취소할 수 있나요?',
    answer:
      '네, 언제든지 구독을 취소할 수 있습니다. 취소 후에도 결제 기간이 끝날 때까지 서비스를 이용할 수 있습니다.',
  },
  {
    question: '발행 실패 시 어떻게 되나요?',
    answer:
      '발행 실패 시 자동으로 최대 3회까지 재시도합니다. 모든 재시도가 실패하면 이메일로 알림을 보내드리며, 대시보드에서 수동으로 재시도할 수 있습니다.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            자주 묻는 질문
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            궁금한 점이 있으신가요? 여기서 답을 찾아보세요.
          </p>
        </div>

        {/* FAQ accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDown
                  className={`text-gray-500 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  size={20}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-5 text-gray-600">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact note */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            찾는 답이 없으신가요?{' '}
            <a href="mailto:support@morav.app" className="text-blue-600 font-medium hover:underline">
              support@morav.app
            </a>
            으로 문의해 주세요.
          </p>
        </div>
      </div>
    </section>
  );
}

'use client';

import { Search, Wand2, Send, BarChart3 } from 'lucide-react';

const steps = [
  {
    step: 1,
    title: '블로그 연결',
    description: '티스토리, 블로거, 워드프레스 등 사용 중인 블로그를 간단하게 연결하세요.',
    icon: Search,
    color: 'bg-blue-500',
  },
  {
    step: 2,
    title: 'AI API 등록',
    description: 'OpenAI, Claude, Gemini 등 원하는 AI 서비스의 API 키를 등록하세요.',
    icon: Wand2,
    color: 'bg-purple-500',
  },
  {
    step: 3,
    title: '카테고리 선택',
    description: '관심 있는 카테고리를 선택하면, 관련 트렌드 키워드를 자동으로 수집합니다.',
    icon: BarChart3,
    color: 'bg-orange-500',
  },
  {
    step: 4,
    title: '자동 발행',
    description: '설정한 시간에 맞춰 AI가 작성한 콘텐츠가 자동으로 블로그에 발행됩니다.',
    icon: Send,
    color: 'bg-green-500',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            어떻게 작동하나요?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            단 4단계로 블로그 자동화를 시작하세요
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 hidden lg:block" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {steps.map((item, index) => (
              <div
                key={item.step}
                className={`relative ${index % 2 === 1 ? 'lg:mt-24' : ''}`}
              >
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  {/* Step number */}
                  <div
                    className={`absolute -top-4 ${
                      index % 2 === 0 ? 'lg:right-0 lg:translate-x-1/2' : 'lg:left-0 lg:-translate-x-1/2'
                    } left-8 lg:left-auto`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${item.color} text-white flex items-center justify-center text-sm font-bold`}
                    >
                      {item.step}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`p-3 ${item.color} bg-opacity-10 rounded-lg`}>
                      <item.icon className={`${item.color.replace('bg-', 'text-')}`} size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Result message */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-6 py-3 rounded-full text-lg font-medium">
            <Wand2 size={20} />
            설정 완료 후, 모든 것이 자동으로 진행됩니다!
          </div>
        </div>
      </div>
    </section>
  );
}

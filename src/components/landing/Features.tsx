'use client';

import {
  TrendingUp,
  Brain,
  Clock,
  Shield,
  Repeat,
  BarChart3,
  Globe,
  Zap,
} from 'lucide-react';

const features = [
  {
    title: '실시간 트렌드 분석',
    description: '네이버와 구글의 실시간 트렌드 키워드를 자동으로 수집하고 분석합니다.',
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'AI 콘텐츠 생성',
    description: 'OpenAI, Claude, Gemini 등 다양한 AI 모델로 고품질 콘텐츠를 생성합니다.',
    icon: Brain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: '예약 발행',
    description: '원하는 시간대에 자동으로 포스트가 발행되도록 스케줄을 설정하세요.',
    icon: Clock,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    title: '멀티 플랫폼 지원',
    description: '티스토리, 구글 블로거, 워드프레스 등 다양한 블로그 플랫폼을 지원합니다.',
    icon: Globe,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'API 키 암호화',
    description: 'AES-256 암호화로 API 키를 안전하게 보관합니다.',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  {
    title: '자동 재시도',
    description: '발행 실패 시 자동으로 최대 3회까지 재시도합니다.',
    icon: Repeat,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
  {
    title: '통계 대시보드',
    description: '발행 현황, 성공률 등 블로그 운영 통계를 한눈에 확인하세요.',
    icon: BarChart3,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  {
    title: '빠른 콘텐츠 생성',
    description: '평균 10분 내에 1,500자 이상의 고품질 콘텐츠가 생성됩니다.',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            강력한 기능들
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            블로그 자동화에 필요한 모든 기능을 제공합니다
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-gray-100"
            >
              <div className={`p-3 ${feature.bgColor} rounded-xl w-fit mb-4`}>
                <feature.icon className={feature.color} size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

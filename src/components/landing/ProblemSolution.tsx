'use client';

import { AlertTriangle, CheckCircle2, X, ArrowRight } from 'lucide-react';

const problems = [
  '매일 새로운 콘텐츠를 작성하는 것이 힘들다',
  '트렌드 키워드를 찾는 데 시간이 너무 많이 걸린다',
  '블로그 수익화를 위해 꾸준히 포스팅해야 하지만 시간이 없다',
  '글 쓰는 실력이 부족해서 자신감이 없다',
];

const solutions = [
  { problem: '콘텐츠 작성', solution: 'AI가 트렌드 키워드로 자동 작성' },
  { problem: '키워드 리서치', solution: '네이버/구글 실시간 트렌드 분석' },
  { problem: '시간 부족', solution: '예약 발행으로 완전 자동화' },
  { problem: '글쓰기 자신감', solution: '1,500자 이상 고품질 콘텐츠 생성' },
];

export default function ProblemSolution() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            블로그 운영, 이런 고민 있으신가요?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            많은 블로거들이 겪는 공통적인 문제들, 모라브가 해결해 드립니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Problems */}
          <div className="bg-red-50 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">기존 방식의 문제점</h3>
            </div>
            <ul className="space-y-4">
              {problems.map((problem, index) => (
                <li key={index} className="flex items-start gap-3">
                  <X className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700">{problem}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div className="bg-green-50 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="text-green-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">모라브의 해결책</h3>
            </div>
            <ul className="space-y-4">
              {solutions.map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="line-through text-gray-400">{item.problem}</span>
                    <ArrowRight size={16} className="text-green-500" />
                    <span className="font-medium text-green-700">{item.solution}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom message */}
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-600">
            <span className="font-semibold text-blue-600">모라브</span>와 함께라면,
            <span className="font-semibold"> 하루 5분</span>으로 블로그 운영이 가능합니다.
          </p>
        </div>
      </div>
    </section>
  );
}

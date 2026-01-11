'use client';

import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: '김민수',
    role: 'IT 블로거',
    content:
      '매일 포스팅하는 게 정말 힘들었는데, 모라브 덕분에 하루 5분이면 끝나요. 트렌드 키워드로 작성된 글이라 조회수도 확실히 늘었습니다.',
    rating: 5,
    avatar: 'M',
  },
  {
    name: '이수진',
    role: '여행 블로거',
    content:
      '여행 다니면서 블로그 관리하기 힘들었는데, 예약 발행 기능 덕분에 여행 중에도 블로그가 자동으로 운영됩니다. 정말 편해요!',
    rating: 5,
    avatar: 'S',
  },
  {
    name: '박준영',
    role: '재테크 블로거',
    content:
      '콘텐츠 품질이 생각보다 훨씬 좋아서 놀랐습니다. 약간의 수정만 하면 바로 발행할 수 있는 수준이에요. 시간이 정말 많이 절약됩니다.',
    rating: 5,
    avatar: 'J',
  },
  {
    name: '최은영',
    role: '라이프스타일 블로거',
    content:
      '3개 블로그를 운영하는데, 모라브 없이는 불가능했을 거예요. 각 블로그마다 다른 카테고리 설정이 가능해서 정말 편리합니다.',
    rating: 5,
    avatar: 'E',
  },
  {
    name: '정호진',
    role: '테크 리뷰어',
    content:
      'Claude API로 작성하니 글의 퀄리티가 남다릅니다. SEO에 최적화된 콘텐츠라 검색 유입이 확실히 늘었어요.',
    rating: 5,
    avatar: 'H',
  },
  {
    name: '한지민',
    role: '맛집 블로거',
    content:
      '무료 플랜으로 시작했다가 바로 Standard로 업그레이드했어요. 이 가격에 이런 서비스는 정말 가성비 최고입니다!',
    rating: 5,
    avatar: 'J',
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            사용자들의 이야기
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            모라브를 사용하는 블로거들의 실제 후기를 확인하세요
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-shadow relative"
            >
              {/* Quote icon */}
              <Quote className="absolute top-6 right-6 text-gray-200" size={32} />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="text-yellow-400 fill-yellow-400" size={18} />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-6 relative z-10">{testimonial.content}</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * @jest-environment node
 */

import {
  classifyKeyword,
  classifyKeywords,
  isValidCategory,
} from '@/lib/keywords/classifier';

describe('Keyword Classifier', () => {
  describe('classifyKeyword', () => {
    it('should classify health-related keywords', () => {
      const result = classifyKeyword('건강검진 비용');
      expect(result.category).toBe('health');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify tech-related keywords', () => {
      const result = classifyKeyword('AI 프로그래밍 강좌');
      expect(result.category).toBe('tech');
    });

    it('should classify entertainment keywords', () => {
      const result = classifyKeyword('BTS 콘서트');
      expect(result.category).toBe('entertainment');
    });

    it('should classify business keywords', () => {
      const result = classifyKeyword('주식 투자 전략');
      expect(result.category).toBe('business');
    });

    it('should classify travel keywords', () => {
      const result = classifyKeyword('제주 여행 코스');
      expect(result.category).toBe('travel');
    });

    it('should classify food keywords', () => {
      const result = classifyKeyword('레시피 추천');
      expect(result.category).toBe('food');
    });

    it('should classify gaming keywords', () => {
      const result = classifyKeyword('롤 시즌 업데이트');
      expect(result.category).toBe('gaming');
    });

    it('should classify automotive keywords', () => {
      const result = classifyKeyword('중고차 시세');
      expect(result.category).toBe('automotive');
    });

    it('should classify sports keywords', () => {
      const result = classifyKeyword('월드컵 경기 일정');
      expect(result.category).toBe('sports');
    });

    it('should classify education keywords', () => {
      const result = classifyKeyword('영어 공부법');
      expect(result.category).toBe('education');
    });

    it('should classify parenting keywords', () => {
      const result = classifyKeyword('육아 팁');
      expect(result.category).toBe('parenting');
    });

    it('should classify fashion keywords', () => {
      const result = classifyKeyword('화장품 추천');
      expect(result.category).toBe('fashion');
    });

    it('should classify lifestyle keywords', () => {
      const result = classifyKeyword('생활 꿀팁');
      expect(result.category).toBe('lifestyle');
    });

    it('should return "other" for unclassified keywords', () => {
      const result = classifyKeyword('asdfghjkl12345');
      expect(result.category).toBe('other');
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should handle empty string', () => {
      const result = classifyKeyword('');
      expect(result.category).toBe('other');
    });

    it('should handle English keywords', () => {
      const result = classifyKeyword('programming tutorial');
      expect(result.category).toBe('tech');
    });
  });

  describe('classifyKeywords', () => {
    it('should classify multiple keywords at once', () => {
      const keywords = ['건강 관리', 'AI 뉴스', '여행 추천'];
      const results = classifyKeywords(keywords);

      expect(results).toHaveLength(3);
      expect(results[0].category).toBe('health');
      expect(results[1].category).toBe('tech');
      expect(results[2].category).toBe('travel');
    });

    it('should handle empty array', () => {
      const results = classifyKeywords([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('isValidCategory', () => {
    it('should return true for valid categories', () => {
      expect(isValidCategory('health')).toBe(true);
      expect(isValidCategory('tech')).toBe(true);
      expect(isValidCategory('other')).toBe(true);
    });

    it('should return false for invalid categories', () => {
      expect(isValidCategory('invalid')).toBe(false);
      expect(isValidCategory('')).toBe(false);
      expect(isValidCategory('HEALTH')).toBe(false);
    });
  });
});

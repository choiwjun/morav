// 키워드 분류 로직

import { VALID_CATEGORY_IDS } from '@/lib/constants/categories';
import { KeywordClassificationResult } from './types';

// 카테고리별 키워드 패턴 (정규식)
const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  health: [
    /건강|의료|병원|약|치료|질병|다이어트|운동|헬스|영양|비타민|면역|암|당뇨|혈압|심장|피부|눈|치과|정신/i,
    /health|medical|hospital|medicine|treatment|diet|vitamin|immune|cancer|diabetes/i,
  ],
  tech: [
    /IT|개발|프로그래밍|코딩|앱|소프트웨어|하드웨어|AI|인공지능|머신러닝|클라우드|서버|보안|해킹|스타트업/i,
    /tech|developer|programming|coding|app|software|hardware|artificial|machine|cloud|server|security/i,
    /아이폰|갤럭시|삼성|애플|구글|마이크로소프트|네이버|카카오|테슬라/i,
  ],
  parenting: [
    /육아|아이|아기|임신|출산|유아|어린이|교육|학교|학원|수능|입시|자녀/i,
    /parenting|baby|child|pregnant|birth|infant|education|school/i,
  ],
  business: [
    /비즈니스|경제|금융|투자|주식|부동산|창업|마케팅|영업|취업|이직|연봉|급여|회사/i,
    /business|economy|finance|invest|stock|real estate|startup|marketing|sales|job|salary/i,
    /코인|비트코인|이더리움|암호화폐|가상화폐|NFT/i,
  ],
  education: [
    /공부|학습|자격증|시험|영어|수학|과학|역사|외국어|독서|책|강의|인강/i,
    /study|learning|certificate|exam|english|math|science|history|language|book|lecture/i,
  ],
  lifestyle: [
    /라이프|생활|일상|팁|꿀팁|정리|청소|인테리어|홈|집/i,
    /lifestyle|daily|tip|organization|cleaning|interior|home/i,
  ],
  travel: [
    /여행|관광|휴가|비행기|호텔|숙소|맛집|카페|해외|국내|제주|부산|서울/i,
    /travel|tour|vacation|flight|hotel|restaurant|cafe|overseas|domestic/i,
  ],
  food: [
    /음식|요리|레시피|맛있|먹방|식당|배달|메뉴|재료|조리/i,
    /food|cooking|recipe|delicious|restaurant|delivery|menu|ingredient/i,
  ],
  fashion: [
    /패션|옷|의류|스타일|뷰티|화장품|메이크업|헤어|네일|피부관리|성형/i,
    /fashion|clothes|style|beauty|cosmetic|makeup|hair|nail|skincare/i,
  ],
  entertainment: [
    /연예|드라마|영화|음악|가수|배우|아이돌|콘서트|공연|예능|방송/i,
    /entertainment|drama|movie|music|singer|actor|idol|concert|show|broadcast/i,
    /BTS|블랙핑크|뉴진스|아이브|에스파|세븐틴|스트레이키즈/i,
  ],
  sports: [
    /스포츠|축구|야구|농구|배구|골프|테니스|수영|마라톤|올림픽|월드컵|프로/i,
    /sports|soccer|football|baseball|basketball|volleyball|golf|tennis|swimming|marathon|olympic/i,
  ],
  automotive: [
    /자동차|차량|운전|면허|주차|정비|중고차|신차|전기차|하이브리드/i,
    /car|vehicle|driving|license|parking|maintenance|used car|new car|electric|hybrid/i,
    /현대|기아|벤츠|BMW|아우디|포르쉐|람보르기니|페라리/i,
  ],
  gaming: [
    /게임|플레이|e스포츠|롤|배그|오버워치|마인크래프트|닌텐도|플스|엑박|스팀/i,
    /game|play|esports|league|pubg|overwatch|minecraft|nintendo|playstation|xbox|steam/i,
  ],
};

/**
 * 키워드를 카테고리로 분류
 */
export function classifyKeyword(keyword: string): KeywordClassificationResult {
  const normalizedKeyword = keyword.toLowerCase().trim();

  // 각 카테고리 패턴과 매칭
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedKeyword)) {
        return {
          keyword,
          category,
          confidence: 0.8,
        };
      }
    }
  }

  // 매칭되지 않으면 'other' 카테고리로 분류
  return {
    keyword,
    category: 'other',
    confidence: 0.3,
  };
}

/**
 * 여러 키워드를 한 번에 분류
 */
export function classifyKeywords(keywords: string[]): KeywordClassificationResult[] {
  return keywords.map((keyword) => classifyKeyword(keyword));
}

/**
 * 카테고리 ID가 유효한지 확인
 */
export function isValidCategory(category: string): boolean {
  return VALID_CATEGORY_IDS.includes(category);
}

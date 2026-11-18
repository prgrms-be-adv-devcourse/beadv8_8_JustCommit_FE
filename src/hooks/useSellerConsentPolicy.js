import { useEffect, useState } from 'react';
import { getSellerConsentPolicy } from '../api/memberApi';

// 판매자 등록 동의 문구 (GET /api/v1/sellers/consent-policy → { version, title, content })
// 로그인해야 받을 수 있어서 가입 중에는 실패함 → 그때는 시안 문구(08-1-1 판매자 등록 펼친 본문)를 기본값으로 보여 줌
export const SELLER_CONSENT_FALLBACK = {
  version: null,
  title: '상품 검수를 위한 외부 AI 서비스 이용 및 국외 이전 동의',
  content: `상품의 안전성과 판매 적합성을 확인하기 위해, 상품 등록 · 수정 과정에서 검수가 필요한 정보를 외부 AI 서비스로 전송합니다.

1. 전송 정보와 목적
- OpenAI: 상품 사진 · 제목 · 설명 / 유해 콘텐츠 여부 검수
- Anthropic: 상품 사진 / 식물 여부 · 품종 · 판매 형태 검수
판매자 이름, 연락처, 계좌정보 등 회원정보는 검수 요청에 별도로 포함하지 않습니다.

2. 국외 이전
- 이전받는 업체: OpenAI, Anthropic
- 이전 국가: 미국 등 해외 처리 시설 (현재 확인된 설정상 처리 지역이 특정 국가로 고정되어 있지 않을 수 있어요)
- 이전 시점 · 방법: 상품 등록 · 수정으로 검수를 요청할 때 네트워크로 전송
- 보관 기간: 검수가 끝나면 각 업체 정책에 따라 삭제

3. 동의를 거부할 권리
동의하지 않을 수 있지만, 동의하지 않으면 판매자로 등록할 수 없어요.`,
};

// 응답을 시안 기본값 위에 덮어씀 (빈 값은 기본값 유지)
export function toConsentPolicy(data) {
  return {
    version: data?.version ?? null,
    title: data?.title || SELLER_CONSENT_FALLBACK.title,
    content: data?.content || SELLER_CONSENT_FALLBACK.content,
  };
}

// enabled가 false면 부르지 않고 기본값만 돌려줌 (로그인 전 가입 화면)
function useSellerConsentPolicy(enabled = true) {
  const [policy, setPolicy] = useState(SELLER_CONSENT_FALLBACK);

  useEffect(() => {
    if (!enabled) return undefined;
    let ignore = false;
    getSellerConsentPolicy()
      .then((response) => {
        if (!ignore) setPolicy(toConsentPolicy(response.data.data));
      })
      .catch(() => {
        // 기본값 그대로
      });
    return () => {
      ignore = true;
    };
  }, [enabled]);

  return policy;
}

export default useSellerConsentPolicy;

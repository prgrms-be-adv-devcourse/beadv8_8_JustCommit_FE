import StepBar from '../market/StepBar';

// 반품 타임라인 (시안 04-4-1 ~ 04-4-3 구매자 주문 상세 · 04-5-1 판매자 판매 주문 상세에서 같은 모양)
// 위: 구매 배송 완료 한 줄(시각이 없으면 숨김), 가운데: 반품 6단계 바 (returnSteps.js buildReturnTimeline),
// 아래: 반품 송장번호 한 줄 (BE items[].returnTrackingNo, 없으면 숨김. 시안 04-4-2 · 04-4-3)
// TODO: 반품 택배 현재 위치 · 배송 조회 API가 생기면 시안처럼 송장번호 옆에 현재 위치와 「배송 조회」를 붙임
function SmallCheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-[#0f4c3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ReturnTimeline({ deliveredTime, steps, trackingNo }) {
  return (
    <>
      {deliveredTime && (
        <div className="px-5 pt-4 flex items-center gap-1.5 text-xs text-[#6b7280]">
          <SmallCheckIcon />
          {'구매 배송 · '}
          <span className="tabular-nums">{deliveredTime}</span>
          {' 배송 완료'}
        </div>
      )}
      <StepBar steps={steps.items} current={steps.current} label={steps.label} />
      {trackingNo && (
        <div className="px-5 py-3 border-b border-[#f3f4f6] flex items-center gap-2.5 text-[13px]">
          <span className="text-[#4b5563] shrink-0">
            {'반품 송장번호 '}
            <span className="font-semibold text-[#111827] tabular-nums">{trackingNo}</span>
          </span>
        </div>
      )}
    </>
  );
}

export default ReturnTimeline;

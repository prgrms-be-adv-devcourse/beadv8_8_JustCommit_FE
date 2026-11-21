import StepBar from '../market/StepBar';

// 반품 타임라인 (시안 04-4-1 ~ 04-4-3 구매자 주문 상세 · 04-5-1 판매자 판매 주문 상세에서 같은 모양)
// 위: 구매 배송 완료 한 줄(시각이 없으면 숨김), 아래: 반품 6단계 바 (returnSteps.js buildReturnTimeline)
function SmallCheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-[#0f4c3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ReturnTimeline({ deliveredTime, steps }) {
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
    </>
  );
}

export default ReturnTimeline;

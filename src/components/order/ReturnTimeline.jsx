import StepBar from '../market/StepBar';

// 반품 타임라인 (시안 04-4-1 ~ 04-4-3 구매자 주문 상세 · 04-5-1 판매자 판매 주문 상세에서 같은 모양)
// 위: 구매 배송 완료 한 줄(시각이 없으면 숨김), 가운데: 반품 6단계 바 (returnSteps.js buildReturnTimeline),
// 아래: 반품 택배 단계(승인 뒤)면 「반품 송장번호 · 배송 조회」 한 줄 (시안 04-4-2 · 04-4-3 · 04-5-4)
//   tracking = { invoiceNo } (반품 송장이 아직 없으면 「예약 전」), 반품 신청 단계면 null → 줄을 숨김
// TODO: 반품 택배 현재 위치 API가 생기면 시안처럼 송장번호 옆에 현재 위치를 붙임 (지금은 값이 없어 숨김)
function SmallCheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-[#0f4c3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ReturnTimeline({ deliveredTime, steps, tracking, onOpenTracking }) {
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
      {tracking && (
        <div className="px-5 py-3 border-b border-[#f3f4f6] flex items-center gap-2.5 text-[13px]">
          <span className="text-[#4b5563] shrink-0">
            {'반품 송장번호 '}
            <span className="font-semibold text-[#111827] tabular-nums">{tracking.invoiceNo}</span>
          </span>
          {onOpenTracking && (
            <button
              type="button"
              className="ml-auto shrink-0 flex items-center gap-0.5 text-[13px] font-semibold text-[#0f4c3a]"
              onClick={onOpenTracking}
            >
              배송 조회
              <ChevronRightIcon />
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default ReturnTimeline;

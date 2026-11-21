import StepBar from '../market/StepBar';

// 반품 타임라인 (시안 04-4-1 ~ 04-4-3 구매자 주문 상세 · 04-5-1 판매자 판매 주문 상세에서 같은 모양)
// 위: 구매 배송 완료 한 줄(시각이 없으면 숨김), 가운데: 반품 6단계 바 (returnSteps.js buildReturnTimeline),
// 아래: 반품 택배 단계(승인 뒤)면 「반품 송장번호 · 배송 조회」 한 줄 (시안 04-4-2 · 04-4-3 · 04-5-4)
//   tracking = { invoiceNo, location?, distance? } (반품 송장이 아직 없으면 「예약 전」), 반품 신청 단계면 null → 줄을 숨김
//   location: 「지점 · 단계 · 시각」 (반품 택배 조회 #621, 없으면 숨김)
//   distance: 반품 수거 전 기사님 거리 { km, checkedAt } (시안 04-4-5 구매자 · 04-5-5 판매자, 없으면 박스를 숨김)
// side: 'buyer' | 'seller' — 거리 박스 문구만 입장에 맞게 다름
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

function PinIcon() {
  return (
    <svg className="w-4 h-4 text-[#0f4c3a] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

const DISTANCE_TEXT = {
  buyer: { title: '반품 상품을 가지러 오는 기사님 거리', note: '상품을 포장해 두고 기사님을 기다려 주세요.' },
  seller: { title: '반품 상품을 가지러 가는 기사님 거리', note: '기사님이 구매자에게서 상품을 가져와 보내 드려요.' },
};

// 반품 수거 전 기사님 거리 (반품은 취소가 없어 2km 안내는 없음)
function ReturnDistanceBox({ distance, side, refreshCooldown, onRefresh }) {
  const text = DISTANCE_TEXT[side] ?? DISTANCE_TEXT.buyer;
  return (
    <div className="mx-5 my-3 px-4 py-3 border bg-[#f9fafb] border-[#e5e7eb] space-y-1">
      <div className="flex items-center gap-3">
        <p className="text-sm text-[#111827]">
          {`${text.title} 약 `}
          <b className="tabular-nums">{distance.km}</b>{' '}
          {distance.checkedAt && (
            <span className="text-[13px] text-[#6b7280] tabular-nums">{`· ${distance.checkedAt} 기준`}</span>
          )}
        </p>
        {onRefresh && (
          <span className="ml-auto">
            {refreshCooldown > 0 ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-[#9ca3af] tabular-nums">
                <RefreshIcon />
                {`${refreshCooldown}초 뒤 새로고침`}
              </span>
            ) : (
              <button type="button" className="flex items-center gap-1 text-xs font-semibold text-[#0f4c3a]" onClick={onRefresh}>
                <RefreshIcon />
                새로고침
              </button>
            )}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-[#0f4c3a]">{text.note}</p>
      <p className="text-xs text-[#6b7280]">표시된 거리는 조회한 순간 기준이라 실제와 다를 수 있어요.</p>
    </div>
  );
}

function ReturnTimeline({ deliveredTime, steps, tracking, onOpenTracking, side = 'buyer', refreshCooldown = 0, onRefresh }) {
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
          {tracking.location && (
            <>
              <span className="text-[#d1d5db]">·</span>
              <span className="flex items-center gap-1 text-[#111827] min-w-0">
                <PinIcon />
                <span className="truncate">{`현재 위치: ${tracking.location}`}</span>
              </span>
            </>
          )}
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
      {tracking?.distance && (
        <ReturnDistanceBox distance={tracking.distance} side={side} refreshCooldown={refreshCooldown} onRefresh={onRefresh} />
      )}
    </>
  );
}

export default ReturnTimeline;

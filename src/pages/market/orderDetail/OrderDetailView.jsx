import { useState } from 'react';
import { Link } from 'react-router-dom';
import StepBar from '../../../components/market/StepBar';
import { ActionErrorLine } from '../../../components/common/ActionError';
import { ChevronIcon, PinIcon, RefreshIcon, SmallCheckIcon } from './icons';
import PageBackLink from '../../../components/common/PageBackLink';

// 시안 03-5 · 04-1 · 04-4 · 05-1 구매자 주문 상세 화면 (데이터는 props로만 받음)
// onCancelAll: 주문 전체 취소가 가능할 때만 넘김 (시안 03-5-2 「주문 전체 취소」 버튼)
// 데이터 모양은 orderDetailModel.js의 buildOrderDetailView 참고

// 상태 배지 색 (판매자 묶음 머리 · 상품 줄)
const BADGE_TONE = {
  shipping: 'bg-[#f4f8f6] border-[#d1e7dd] text-[#0f4c3a]',
  pending: 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]',
  confirmed: 'bg-white border-[#0f4c3a] text-[#0f4c3a]',
  closed: 'bg-[#f3f4f6] border-[#f3f4f6] text-[#6b7280]',
};

// 상품 줄 아래 안내 문구 색
const NOTE_TONE = {
  muted: 'text-[13px] text-[#6b7280]',
  pending: 'text-[13px] text-[#92400e]',
  danger: 'text-[13px] text-[#b91c1c] font-medium',
  success: 'text-[13px] text-[#0f4c3a] font-medium',
};

// 배송 줄 앞 작은 배지 (기사 배정 · 택배 예약 중 · 취소 처리 중 · 취소 불가)
const TAG_TONE = {
  default: 'bg-white border border-[#0f4c3a] text-[#0f4c3a]',
  danger: 'bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c]',
};

function Badge({ badge }) {
  return (
    <span className={`h-7 px-2.5 flex items-center border text-[13px] font-semibold shrink-0 ${BADGE_TONE[badge.tone]}`}>
      {badge.label}
    </span>
  );
}

function Separator() {
  return <span className="text-[#d1d5db]">·</span>;
}

// 송장번호 · 현재 위치 · 배송 조회 한 줄
function TrackingLine({ tracking, onOpenTracking }) {
  return (
    <div className="px-5 py-3 border-b border-[#f3f4f6] flex items-center gap-2.5 text-[13px]">
      {tracking.tag && (
        <>
          <span className={`h-6 px-2 inline-flex items-center text-xs font-semibold ${TAG_TONE[tracking.tag.tone]} shrink-0`}>
            {tracking.tag.label}
          </span>
          <Separator />
        </>
      )}
      {tracking.invoiceNo && (
        <>
          <span className="text-[#4b5563] shrink-0">
            {`${tracking.invoiceLabel} `}
            <span className="font-semibold text-[#111827] tabular-nums">{tracking.invoiceNo}</span>
          </span>
          {tracking.location && <Separator />}
        </>
      )}
      {tracking.location && (
        <span className="flex items-center gap-1 text-[#111827] min-w-0">
          <PinIcon />
          <span className="truncate">{tracking.location}</span>
        </span>
      )}
      <button
        type="button"
        className="ml-auto shrink-0 flex items-center gap-0.5 text-[13px] font-semibold text-[#0f4c3a]"
        onClick={onOpenTracking}
      >
        배송 조회
        <ChevronIcon direction="right" />
      </button>
    </div>
  );
}

// 수거지까지 기사님 거리 (픽업 대기 · 취소 가능 여부 안내)
function DistanceBox({ distance, refreshCooldown, onRefresh }) {
  const box = distance.locked ? 'bg-[#fef2f2] border-[#fecaca]' : 'bg-[#f9fafb] border-[#e5e7eb]';
  return (
    <div className={`mx-5 my-3 px-4 py-3 border ${box} space-y-1`}>
      <div className="flex items-center gap-3">
        {distance.km && (
          <p className="text-sm text-[#111827]">
            {'수거지까지 기사님 거리 약 '}
            <b className="tabular-nums">{distance.km}</b>{' '}
            {distance.checkedAt && (
              <span className="text-[13px] text-[#6b7280] tabular-nums">{`· ${distance.checkedAt} 기준`}</span>
            )}
          </p>
        )}
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
      </div>
      <p className="text-xs font-medium text-[#92400e]">기사님이 수거지 2km 안으로 들어오면 취소할 수 없어요.</p>
      <p className="text-xs text-[#6b7280]">
        표시된 거리는 조회한 순간 기준이라 실제와 다를 수 있어요. 2km 안이면 취소가 거절될 수 있어요.
      </p>
    </div>
  );
}

// 반품이 있는 묶음의 단계 바 위 한 줄
function Headline({ headline }) {
  if (headline.kind === 'delivered') {
    return (
      <div className="px-5 pt-4 flex items-center gap-1.5 text-xs text-[#6b7280]">
        <SmallCheckIcon />
        {'구매 배송 · '}
        <span className="tabular-nums">{headline.time}</span>
        {' 배송 완료'}
      </div>
    );
  }
  return <div className="px-5 pt-4 text-xs text-[#4b5563]">{headline.text}</div>;
}

const ACTION_BUTTON = 'h-9 w-[88px] flex items-center justify-center text-sm font-semibold';

function ItemRow({ item, busy, onAction }) {
  return (
    <li className="px-5 py-4 flex items-center gap-4">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className={`w-16 h-16 object-cover border border-[#e5e7eb] shrink-0${item.dimmed ? ' grayscale opacity-60' : ''}`}
        />
      ) : (
        <span className="w-16 h-16 border border-[#e5e7eb] shrink-0 bg-[#f3f4f6]" aria-hidden="true" />
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-[15px] font-medium text-[#111827] truncate">
          <Link to={`/products/${item.productId}`}>{item.name}</Link>
        </p>
        <p className="text-[15px] font-bold text-[#111827]">{item.price}</p>
        {item.note && <p className={NOTE_TONE[item.note.tone]}>{item.note.text}</p>}
        <ActionErrorLine message={item.error} className="" />
      </div>
      {item.badge && <Badge badge={item.badge} />}
      <div className="flex items-center gap-2 shrink-0">
        {item.canReturn && (
          <button
            type="button"
            className={`${ACTION_BUTTON} bg-white border border-[#d1d5db] text-[#b91c1c]`}
            onClick={() => onAction('return', item)}
          >
            반품 신청
          </button>
        )}
        {item.canConfirm && (
          <button
            type="button"
            className={`${ACTION_BUTTON} bg-[#0f4c3a] border border-[#0f4c3a] text-white`}
            disabled={busy}
            onClick={() => onAction('confirm', item)}
          >
            구매 확정
          </button>
        )}
        {item.cancel === 'enabled' && (
          <button
            type="button"
            className={`${ACTION_BUTTON} bg-white border border-[#d1d5db] text-[#b91c1c]`}
            disabled={busy}
            onClick={() => onAction('cancel', item)}
          >
            취소
          </button>
        )}
        {item.cancel === 'locked' && (
          <button type="button" disabled className={`${ACTION_BUTTON} bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed`}>
            취소
          </button>
        )}
      </div>
    </li>
  );
}

function SellerGroup({ group, busyItemId, refreshCooldown, onAction, onOpenTracking, onRefreshDistance }) {
  // 할 일이 있는 묶음만 처음에 펼쳐 둠 (group.expanded)
  const [expanded, setExpanded] = useState(group.expanded);

  return (
    <section className="bg-white border border-[#d1d5db]">
      <button
        type="button"
        aria-expanded={expanded}
        className={`w-full px-5 py-3.5 bg-[#f9fafb]${expanded ? ' border-b border-[#e5e7eb]' : ''} flex items-center gap-3 text-left`}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="text-[15px] font-bold text-[#111827]">{group.sellerName}</span>
        <span className="text-[13px] text-[#6b7280]">{group.meta}</span>
        <span className="ml-auto flex items-center gap-3">
          <Badge badge={group.badge} />
          <ChevronIcon direction={expanded ? 'up' : 'down'} />
        </span>
      </button>

      {expanded ? (
        <>
          {group.headline && <Headline headline={group.headline} />}
          {group.steps && <StepBar steps={group.steps.items} current={group.steps.current} label={group.steps.label} />}
          {group.acceptNotice && (
            <div className="px-5 py-3 border-b border-[#f3f4f6] text-[13px] text-[#92400e]">{group.acceptNotice}</div>
          )}
          {group.tracking && <TrackingLine tracking={group.tracking} onOpenTracking={() => onOpenTracking(group)} />}
          {group.distance && (
            <DistanceBox distance={group.distance} refreshCooldown={refreshCooldown} onRefresh={onRefreshDistance} />
          )}
          <ul className="divide-y divide-[#f3f4f6]">
            {group.items.map((item) => (
              <ItemRow key={item.id} item={item} busy={busyItemId === item.id} onAction={onAction} />
            ))}
          </ul>
        </>
      ) : (
        <div className="px-5 py-3 border-t border-[#f3f4f6] flex items-center gap-2.5 text-[13px] text-[#4b5563]">
          <span className="text-[#111827] font-medium truncate">{group.summary}</span>
          {group.location && (
            <>
              <Separator />
              <span className="flex items-center gap-1 min-w-0">
                <PinIcon />
                <span className="truncate">{group.location}</span>
              </span>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function OrderDetailView({
  view,
  busyItemId = null,
  refreshCooldown = 0,
  onAction = () => {},
  onOpenTracking = () => {},
  onRefreshDistance = () => {},
  onCancelAll = null,
  children,
}) {
  const { order } = view;
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[960px] mx-auto space-y-6">
        <PageBackLink to="/orders" label="주문 목록" />
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">주문 상세</h1>
        <section className="bg-white border border-[#e5e7eb] p-6">
          {onCancelAll ? (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#111827]">주문 정보</h2>
              <button
                type="button"
                className="h-9 px-4 flex items-center justify-center bg-white border border-[#d1d5db] text-sm font-semibold text-[#b91c1c]"
                onClick={onCancelAll}
              >
                주문 전체 취소
              </button>
            </div>
          ) : (
            <h2 className="text-lg font-bold text-[#111827] mb-4">주문 정보</h2>
          )}
          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
            <div className="space-y-1">
              <dt className="text-[13px] text-[#6b7280]">주문 번호</dt>
              <dd className="font-semibold text-[#111827] tabular-nums tracking-tight">{order.orderNo}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-[13px] text-[#6b7280]">주문 일시</dt>
              <dd className="font-semibold text-[#111827] tabular-nums">{order.createdAt}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-[13px] text-[#6b7280]">결제 금액 (예치금)</dt>
              <dd className="space-y-0.5">
                <p className="text-lg font-black text-[#0f4c3a] tracking-tight">{order.totalAmount}</p>
                <p className="text-xs text-[#6b7280]">{order.amountDetail}</p>
                {order.refundNote && <p className="text-xs text-[#6b7280]">{order.refundNote}</p>}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-[13px] text-[#6b7280]">배송지</dt>
              <dd className="text-[#111827] leading-relaxed">
                {order.recipient}
                <br />
                {order.address}
              </dd>
            </div>
          </dl>
        </section>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#111827]">
            {'주문 상품 '}
            <span className="text-[15px] font-medium text-[#6b7280]">{view.itemSummary}</span>
          </h2>
          {view.groups.map((group) => (
            <SellerGroup
              key={group.key}
              group={group}
              busyItemId={busyItemId}
              refreshCooldown={refreshCooldown}
              onAction={onAction}
              onOpenTracking={onOpenTracking}
              onRefreshDistance={onRefreshDistance}
            />
          ))}
        </div>
      </div>
      {children}
    </main>
  );
}

export default OrderDetailView;

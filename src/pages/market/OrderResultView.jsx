import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/format';

// 시안 03-3 주문 결과 (OrderDone · OrderFail · OrderExpired)
// 데이터는 모두 props로 받음 → 페이지가 API를 부르고, 비교 하네스는 가짜 데이터를 넣음

const SECONDARY_LINK = 'flex-1 h-12 flex items-center justify-center bg-white border border-[#0f4c3a] text-[#0f4c3a] text-[15px] font-bold';
const PRIMARY_LINK = 'flex-1 h-12 flex items-center justify-center bg-[#0f4c3a] text-white text-[15px] font-bold';

function ResultCard({ children }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 py-16 flex justify-center">
      <section className="w-full max-w-[560px] bg-white border border-[#e5e7eb] p-10 flex flex-col items-center text-center gap-7">
        {children}
      </section>
    </main>
  );
}

function ErrorIcon({ path }) {
  return (
    <div className="w-16 h-16 bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center">
      <svg className="w-8 h-8 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
      </svg>
    </div>
  );
}

// 초록 안내 상자 (예치금 아이콘)
function WalletNotice({ children }) {
  return (
    <div className="w-full px-5 py-4 bg-[#f4f8f6] border border-[#d1e7dd] text-left flex gap-3">
      <svg className="w-5 h-5 text-[#0f4c3a] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
      <p className="text-sm font-medium text-[#0f4c3a] leading-relaxed">{children}</p>
    </div>
  );
}

function RetryLinks() {
  return (
    <div className="w-full flex gap-3">
      <Link to="/" className={SECONDARY_LINK}>
        다른 식물 보러 가기
      </Link>
      <Link to="/cart" className={PRIMARY_LINK}>
        장바구니로 돌아가기
      </Link>
    </div>
  );
}

// 03-3-1 주문 완료
export function OrderDoneView({ orderId, orderNo, totalAmount, onCopy }) {
  return (
    <ResultCard>
      <div className="w-16 h-16 bg-[#f4f8f6] border border-[#d1e7dd] flex items-center justify-center">
        <svg className="w-8 h-8 text-[#0f4c3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-[#111827] tracking-tight">주문이 완료됐어요</h1>

      <dl className="w-full border border-[#e5e7eb] divide-y divide-[#e5e7eb] text-sm text-left">
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <dt className="text-[#6b7280] shrink-0">주문 번호</dt>
          <dd className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-[#111827] tabular-nums tracking-tight">{orderNo}</span>
            <button
              type="button"
              className="h-7 px-2.5 bg-white border border-[#d1d5db] text-xs font-medium text-[#111827] shrink-0"
              onClick={onCopy}
            >
              복사
            </button>
          </dd>
        </div>
        <div className="px-5 py-4 flex items-baseline justify-between gap-4">
          <dt className="text-[#6b7280]">결제 금액</dt>
          <dd className="text-xl font-black text-[#0f4c3a] tracking-tight">{formatPrice(totalAmount)}</dd>
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <dt className="text-[#6b7280]">결제 수단</dt>
          <dd className="font-semibold text-[#111827]">예치금</dd>
        </div>
      </dl>

      <div className="w-full px-5 py-4 bg-[#f4f8f6] border border-[#d1e7dd] text-left flex gap-3">
        <svg className="w-5 h-5 text-[#0f4c3a] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <div>
          <p className="text-sm font-bold text-[#0f4c3a]">판매자가 주문을 수락하면 알려 드려요</p>
          <p className="mt-1 text-[13px] text-[#4b5563] leading-relaxed">
            판매자가 24시간 안에 수락하지 않으면 주문이 자동으로 취소되고 예치금으로 환불돼요.
          </p>
        </div>
      </div>

      <div className="w-full flex gap-3">
        <Link to={`/orders/${orderId}`} className={SECONDARY_LINK}>
          주문 상세 보기
        </Link>
        <Link to="/" className={PRIMARY_LINK}>
          쇼핑 계속하기
        </Link>
      </div>
    </ResultCard>
  );
}

// 상품 상태 배지 (거래 중 = 다른 분이 결제 중 · 판매 완료 · 그 밖의 구매 불가)
function FailBadge({ item }) {
  if (item.status === 'PAYMENT_PENDING') {
    return (
      <>
        <span className="text-[11px] font-semibold px-1.5 py-0.5 border bg-[#f4f8f6] text-[#0f4c3a] border-[#d1e7dd]">거래 중</span>
        <span className="text-xs text-[#6b7280]">결제가 안 되면 다시 판매될 수 있어요</span>
      </>
    );
  }
  return (
    <span className="text-[11px] font-semibold px-1.5 py-0.5 border bg-[#111827] text-white border-[#111827]">
      {item.status === 'SOLD_OUT' ? '판매 완료' : '구매 불가'}
    </span>
  );
}

// 03-3-2 주문 실패 (다른 분이 먼저 주문한 상품이 있음)
// items = [{ key, title, price, thumbnailUrl, status }]
export function OrderFailView({ items }) {
  return (
    <ResultCard>
      <ErrorIcon path="M12 9v3.75m0 3.75h.008M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">주문하지 못했어요</h1>
        <p className="text-sm text-[#4b5563] leading-relaxed">
          다른 분이 먼저 주문한 상품이 있어요. 이 상품을 빼고 다시 주문해 주세요.
        </p>
      </div>
      {items.length > 0 && (
        <ul className="w-full border border-[#e5e7eb] px-5 py-4 divide-y divide-[#e5e7eb] text-left">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className={`w-14 h-14 object-cover border border-[#e5e7eb] shrink-0${item.status === 'PAYMENT_PENDING' ? '' : ' grayscale'}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111827] truncate">{item.title}</p>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[#111827]">{formatPrice(item.price)}</span>
                  <FailBadge item={item} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <WalletNotice>예치금은 빠져나가지 않았어요. 주문하려던 상품은 장바구니에 그대로 있어요.</WalletNotice>
      <RetryLinks />
    </ResultCard>
  );
}

// 03-3-3 결제 시간 만료
export function OrderExpiredView({ orderNo, totalAmount }) {
  return (
    <ResultCard>
      <ErrorIcon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">결제 시간이 지났어요</h1>
        <p className="text-sm text-[#4b5563] leading-relaxed">주문한 시각부터 10분 안에 결제하지 않아 주문이 취소됐어요.</p>
      </div>
      {orderNo && (
        <dl className="w-full border border-[#e5e7eb] divide-y divide-[#e5e7eb] text-sm text-left">
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <dt className="text-[#6b7280] shrink-0">주문 번호</dt>
            <dd className="font-semibold text-[#111827] tabular-nums tracking-tight">{orderNo}</dd>
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <dt className="text-[#6b7280]">결제할 금액</dt>
            <dd className="font-semibold text-[#9ca3af] line-through">{formatPrice(totalAmount)}</dd>
          </div>
        </dl>
      )}
      <WalletNotice>
        예치금은 빠져나가지 않았어요. 이 주문을 위해 충전한 금액도 예치금에 그대로 있어요. 상품은 다시 판매되니
        장바구니에서 다시 주문해 주세요.
      </WalletNotice>
      <RetryLinks />
    </ResultCard>
  );
}

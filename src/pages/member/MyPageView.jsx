import { Link } from 'react-router-dom';

// 시안 06-4-1 마이페이지(판매자) · 06-4-2 마이페이지(일반 회원)
// props
//   profile = { nickname, email, joinedAt('2026.03.02'), isSeller }
//   balanceText: '128,500원' (조회 실패면 '-')
//   counts = { reviews, notifications, salesOrders } 메뉴 옆 숫자 (0 · 빈 값이면 안 보임)
//   links = { shop } 판매자 상점 경로

function Chevron({ className = 'w-5 h-5 text-[#9ca3af]' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function MenuLink({ to, label, count }) {
  return (
    <Link
      to={to}
      className="h-14 px-6 flex items-center gap-3 border-t border-[#f3f4f6] text-[15px] font-medium text-[#111827]"
    >
      <span className="flex-1">{label}</span>
      {count ? (
        <span className="min-w-[22px] h-[22px] px-1.5 flex items-center justify-center bg-[#0f4c3a] text-white text-xs font-semibold">
          {count}
        </span>
      ) : null}
      <Chevron />
    </Link>
  );
}

function MenuGroup({ title, items }) {
  return (
    <nav className="bg-white border border-[#e5e7eb]" aria-label={title}>
      <h2 className="px-6 pt-5 pb-3 text-sm font-bold text-[#4b5563]">{title}</h2>
      {items.map((item) => (
        <MenuLink key={item.label} {...item} />
      ))}
    </nav>
  );
}

function MyPageView({ profile, balanceText, counts, links }) {
  const shopping = [
    { to: '/orders', label: '주문 내역' },
    { to: '/mypage/reviews', label: '리뷰 관리', count: counts.reviews },
    { to: '/wallet', label: '예치금 내역' },
    { to: '/notifications', label: '알림', count: counts.notifications },
  ];
  const selling = [
    { to: '/mypage/products', label: '판매 상품 목록' },
    { to: '/orders/seller', label: '판매 주문 목록', count: counts.salesOrders },
    { to: '/settlements', label: '정산 리포트' },
    { to: links.shop, label: '내 상점 보기' },
  ];

  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-8 pb-16">
      <div className="max-w-[880px] mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">마이페이지</h1>
        <div className="grid grid-cols-2 gap-4">
          <section className="p-6 bg-white border border-[#e5e7eb] flex items-start gap-4" aria-label="프로필">
            <span className="w-14 h-14 flex items-center justify-center bg-[#0f4c3a] text-white text-xl font-bold shrink-0">
              {profile.nickname.slice(0, 1)}
            </span>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-[#111827]">{profile.nickname}</p>
                {profile.isSeller && (
                  <span className="h-6 px-2 flex items-center bg-[#0f4c3a] text-white text-xs font-semibold">판매자</span>
                )}
              </div>
              <p className="text-sm text-[#4b5563]">{profile.email}</p>
              {profile.joinedAt && <p className="text-[13px] text-[#6b7280]">{`가입일 ${profile.joinedAt}`}</p>}
            </div>
            <Link
              to="/mypage/account"
              className="flex items-center gap-0.5 text-[13px] font-semibold text-[#0f4c3a] whitespace-nowrap"
            >
              회원 정보 수정
              <Chevron className="w-4 h-4 text-[#0f4c3a]" />
            </Link>
          </section>
          <section className="p-6 bg-white border border-[#e5e7eb] flex flex-col justify-between gap-4" aria-label="예치금">
            <div className="space-y-1">
              <p className="text-sm text-[#4b5563]">보유 예치금</p>
              <p className="text-[26px] font-black text-[#111827] tabular-nums tracking-tight">{balanceText}</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/deposit/charge"
                className="flex-1 h-11 flex items-center justify-center bg-[#0f4c3a] text-white text-sm font-semibold"
              >
                충전하기
              </Link>
              <Link
                to="/wallet/withdraw"
                className="flex-1 h-11 flex items-center justify-center bg-white border border-[#d1d5db] text-sm font-semibold text-[#111827]"
              >
                인출하기
              </Link>
            </div>
          </section>
        </div>
        <MenuGroup title="쇼핑" items={shopping} />
        {profile.isSeller ? (
          <MenuGroup title="판매" items={selling} />
        ) : (
          <section className="p-6 bg-[#f4f8f6] border border-[#d1e7dd] flex items-center gap-6">
            <div className="flex-1 space-y-1">
              <h2 className="text-lg font-bold text-[#111827]">직접 키운 식물을 판매해 보세요</h2>
              <p className="text-sm text-[#4b5563]">
                판매자로 등록하면 바로 식물을 올릴 수 있어요. 정산은 가입할 때 입력한 환급 계좌로 받아요.
              </p>
            </div>
            <Link
              to="/seller/register"
              className="h-11 w-[160px] flex items-center justify-center bg-[#0f4c3a] text-white text-sm font-semibold shrink-0"
            >
              판매자 등록하기
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

export default MyPageView;

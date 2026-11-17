import { Link } from 'react-router-dom';

// 「‹ 예치금」 돌아가기 링크 (시안 07-3 충전 내역 · 07-4 인출 내역 맨 위)
function WalletBackLink() {
  return (
    <Link to="/wallet" className="h-11 inline-flex items-center gap-1.5 text-sm font-medium text-[#4b5563]">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
      </svg>
      예치금
    </Link>
  );
}

export default WalletBackLink;

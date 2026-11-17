import { Link } from 'react-router-dom';

// 시안 화면 맨 위 「< 마이페이지」 같은 뒤로 가기 링크 (06 · 05 시안 공통 모양)
// TODO: 여러 갈래에서 같은 모양을 쓰면 01 공통(components/common)으로 옮기는 것을 제안
function DesignBackLink({ to, label }) {
  return (
    <Link to={to} className="h-11 inline-flex items-center gap-1.5 text-sm font-medium text-[#4b5563]">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  );
}

export default DesignBackLink;

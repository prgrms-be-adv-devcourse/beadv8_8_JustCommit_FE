import { Link } from 'react-router-dom';

// 화면 맨 위 「‹ 이전 화면」 뒤로 가기 링크 (02 ~ 09 시안 공통 모양)
// state: 돌아간 화면에 넘길 router state (예: 상점으로 돌아갈 때 처음 들어온 상품 정보)
function PageBackLink({ to, label, state }) {
  return (
    <Link to={to} state={state} className="h-11 inline-flex items-center gap-1.5 text-sm font-medium text-[#4b5563]">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  );
}

export default PageBackLink;

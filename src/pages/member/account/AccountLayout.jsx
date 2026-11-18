import { useContext } from 'react';
import { Link } from 'react-router-dom';
import PageBackLink from '../../../components/common/PageBackLink';
import { AccountMenuContext } from './accountMenuContext';

// 시안 06-5 회원 정보 수정 공통 틀: 왼쪽 메뉴 + 오른쪽 카드
// active: 메뉴 key / wide: 카드 안 너비 제한 없음 (배송지 관리)
const ACCOUNT_MENU = [
  { key: 'nickname', to: '/mypage/account', label: '닉네임 변경' },
  { key: 'password', to: '/mypage/account/password', label: '비밀번호 변경' },
  { key: 'bank', to: '/mypage/account/bank', label: '계좌 변경' },
  { key: 'addresses', to: '/mypage/addresses', label: '배송지 관리' },
  { key: 'withdraw', to: '/mypage/account/withdraw', label: '회원 탈퇴', divided: true },
];

function AccountLayout({ active, wide = false, children }) {
  // 카카오 가입 회원은 비밀번호가 없으므로 「비밀번호 변경」 탭을 숨김
  const { isKakao } = useContext(AccountMenuContext);
  const menu = isKakao ? ACCOUNT_MENU.filter((item) => item.key !== 'password') : ACCOUNT_MENU;

  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[1040px] mx-auto space-y-6">
        <PageBackLink to="/mypage" label="마이페이지" />
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">회원 정보 수정</h1>
        <div className="flex items-start gap-6">
          <ul className="w-[220px] shrink-0 bg-white border border-[#e5e7eb] py-2">
            {menu.map((item) => (
              <li key={item.key} className={item.divided ? 'mt-2 pt-2 border-t border-[#f3f4f6]' : ''}>
                <Link
                  to={item.to}
                  aria-current={item.key === active ? 'page' : undefined}
                  className={
                    item.key === active
                      ? 'h-12 px-4 flex items-center text-[15px] bg-[#f4f8f6] text-[#0f4c3a] font-bold border-l-2 border-[#0f4c3a]'
                      : 'h-12 px-4 flex items-center text-[15px] text-[#4b5563] font-medium border-l-2 border-transparent'
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <section className="flex-1 min-w-0 bg-white border border-[#e5e7eb] p-8">
            <div className={`${wide ? 'max-w-none' : 'max-w-[480px]'} space-y-6`}>{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default AccountLayout;

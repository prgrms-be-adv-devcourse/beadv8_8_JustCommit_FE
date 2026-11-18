import { createContext } from 'react';

// 회원 정보 수정 메뉴에 필요한 내 정보 (AccountGuard가 채움)
// isKakao: 카카오 가입 회원이면 「비밀번호 변경」 탭을 숨김
export const AccountMenuContext = createContext({ isKakao: false });

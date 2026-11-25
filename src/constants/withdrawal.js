// 카카오 연결 해제 뒤 탈퇴가 보류됐던 회원이 다시 로그인해 복구됐다는 표시 (BE #616)
// 백엔드가 /oauth/callback?notice=WITHDRAWAL_HELD로 보내면 콜백 화면이 홈으로 넘겨 팝업을 한 번 띄움
export const WITHDRAWAL_HELD_NOTICE = 'WITHDRAWAL_HELD';

// 팝업의 「탈퇴 화면 바로가기」로 탈퇴 화면에 갈 때 넘기는 state: 들어오자마자 지금 막힌 이유를 확인함
export const WITHDRAW_CHECK_ON_ENTRY_STATE = { checkEligibility: true };

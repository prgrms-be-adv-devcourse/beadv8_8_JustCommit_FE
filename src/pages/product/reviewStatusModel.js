// 판매자 검수 상태(BE 검수 기록 · 내 상품 목록의 reviewStatus) → 화면 단계
// BE 값: status IN_REVIEW · ADMIN_CHECK · ADMIN_CHECK_DELAYED · APPROVED · REJECTED · REPLACED
//        decidedBy ENGINE(자동) · ADMIN(관리자) · DEADLINE(관리자 확인 기한 초과)
// 화면 단계(ReviewResultView): CHECKING · MANUAL · DELAYED · PASSED · REJECTED · REJECTED_ADMIN · EXPIRED
import { REVIEW_REJECT_HELP, REVIEW_REJECT_REASON } from '../../constants/seller';
import { formatDateTime } from '../../utils/format';

export const DECIDED_BY_LABEL = { ENGINE: '자동 판정', ADMIN: '관리자 판정', DEADLINE: '기한 초과' };

// 검수 결과 한 줄 → 화면 단계. 검수 기록이 없으면 상품 상태로 고름
export function toReviewStage({ status, decidedBy, rejectReason } = {}, productStatus) {
  switch (status) {
    case 'IN_REVIEW':
    case 'REPLACED':
      return 'CHECKING';
    case 'ADMIN_CHECK':
      return 'MANUAL';
    case 'ADMIN_CHECK_DELAYED':
      return 'DELAYED';
    case 'APPROVED':
      return 'PASSED';
    case 'REJECTED':
      if (decidedBy === 'DEADLINE' || rejectReason === 'REVIEW_EXPIRED') return 'EXPIRED';
      return decidedBy === 'ADMIN' ? 'REJECTED_ADMIN' : 'REJECTED';
    default:
      if (productStatus === 'REVIEW_PENDING') return 'CHECKING';
      if (productStatus === 'REJECTED') return 'REJECTED';
      return 'PASSED';
  }
}

// 반려 사유 문구: BE가 준 문구(관리자 「기타」 입력 포함) → 없으면 코드 표
export function rejectReasonText({ rejectReason, rejectMessage }) {
  return rejectMessage ?? REVIEW_REJECT_REASON[rejectReason] ?? '반려 사유를 불러오지 못했어요';
}

// 검수 기록 응답(GET products/{id}/imageReviews) → ReviewResultView의 review
// 최신 버전이 REPLACED(판매 중 글 검사 도중 예약 등으로 반영 안 됨)면 건너뛰고 그 전 버전으로 고름.
// 남은 버전이 없으면 상품 상태로 고름 (REPLACED를 CHECKING으로 두면 끝나지 않는 검수 중 화면 · 폴링이 됨)
export function toReviewResult(history, productStatus) {
  const latest = history?.reviews?.find((item) => item.status !== 'REPLACED') ?? {};
  const stage = toReviewStage(latest, history?.productStatus ?? productStatus);
  return {
    stage,
    reasonTitle: rejectReasonText(latest),
    reasonHelp: REVIEW_REJECT_HELP[latest.rejectReason] ?? '',
    decidedByLabel: DECIDED_BY_LABEL[latest.decidedBy] ?? '',
    decidedAt: latest.decidedAt ? formatDateTime(latest.decidedAt) : '',
    expiresAt: latest.expiresAt ? formatDateTime(latest.expiresAt) : '',
    reReviewLeft: history?.remainingResubmits ?? 0,
    appealable: Boolean(history?.appealable),
    resubmittable: Boolean(history?.resubmittable),
  };
}

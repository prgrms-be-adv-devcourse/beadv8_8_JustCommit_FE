import { ActionErrorLine } from '../../../components/common/ActionError';
import AccountLayout from './AccountLayout';
import { CardTitle, CheckLine, SubmitButton } from './AccountUi';

export const INTRO_MAX_LENGTH = 500; // BE SellerIntroChangeRequest @Size(max = 500)

// 시안 06-5-2 회원 정보 수정 · 판매자 소개 (판매자만)
// props: intro, onIntroChange, canSubmit, isSubmitting, onSubmit, submitError, saved(저장 직후 초록 줄)
function IntroView({ intro, onIntroChange, canSubmit, isSubmitting, onSubmit, submitError, saved = false }) {
  return (
    <AccountLayout active="intro">
      <CardTitle title="판매자 소개" description="내 상점 위쪽에 보이는 소개글이에요." />
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#111827]">소개글</span>
        <textarea
          rows={6}
          value={intro}
          maxLength={INTRO_MAX_LENGTH}
          placeholder="키우는 식물, 포장 방법, 거래할 때 알려 드리고 싶은 점을 적어 주세요"
          className="w-full px-4 py-3 border text-[15px] leading-relaxed text-[#111827] placeholder-[#9ca3af] focus:ring-0 focus:border-[#0f4c3a] border-[#0f4c3a] resize-none"
          onChange={(event) => onIntroChange(event.target.value)}
        />
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#6b7280]">비워 두고 저장하면 소개글이 지워져요</span>
          <span className="text-[#6b7280] tabular-nums">{`${intro.length} / ${INTRO_MAX_LENGTH}`}</span>
        </div>
      </label>
      <div>
        <SubmitButton disabled={!canSubmit || isSubmitting} onClick={onSubmit}>
          저장하기
        </SubmitButton>
        {/* 저장 완료 줄은 시안에 없음: 닉네임 변경처럼 값이 바로 바뀌지 않아 알려 주려고 둠 */}
        {saved && <CheckLine className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-[#0f4c3a]">소개글을 저장했어요</CheckLine>}
        <ActionErrorLine message={submitError} />
      </div>
    </AccountLayout>
  );
}

export default IntroView;

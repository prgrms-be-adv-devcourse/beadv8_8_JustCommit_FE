import { Link } from 'react-router-dom';
import { ActionErrorLine } from '../../components/common/ActionError';
import SellerConsentBox from '../../components/member/SellerConsentBox';

export const INTRO_MAX_LENGTH = 500;

// 시안 08-1-1 판매자 등록 (화면만, 데이터는 props)
// account: 「KB국민은행 ***4567 · 예금주 김*식」처럼 완성된 문자열 (예금주는 백엔드가 가려 준 값 그대로)
// consentPolicy: { title, content } (useSellerConsentPolicy). 동의 상자는 처음부터 펼쳐 둠
// consentKey: 바뀌면 동의 상자를 새로 그려 펼침 상태를 처음으로 되돌림 (취소)
function SellerRegisterView({
  account,
  consentPolicy,
  consentKey,
  intro,
  onIntroChange,
  agreed,
  onAgreedChange,
  isSubmitting,
  errorMessage,
  onCancel,
  onSubmit,
}) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 py-14 flex justify-center items-start">
      <section className="w-full max-w-[640px] bg-white border border-[#e5e7eb] p-9 space-y-7">
        <div className="space-y-1.5 text-center">
          <p className="text-xs font-bold text-[#0f4c3a]">판매자 등록</p>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">직접 키운 식물을 판매해 보세요</h1>
          <p className="text-sm text-[#4b5563]">
            판매자로 등록하면 바로 식물을 올릴 수 있어요. 정산금은 예치금으로 들어오고, 가입 때 등록한 계좌로 인출할 수 있어요.
          </p>
        </div>
        <div className="space-y-2">
          <span className="text-sm font-bold text-[#111827]">정산 받을 계좌</span>
          <div className="h-12 px-4 flex items-center justify-between bg-[#f3f4f6] border border-[#e5e7eb] text-[15px] text-[#111827] tabular-nums">
            <span>{account}</span>
            <Link to="/mypage/account/bank" className="text-[13px] font-semibold text-[#0f4c3a] underline">
              계좌 변경
            </Link>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="seller-intro" className="text-sm font-bold text-[#111827]">
            판매자 소개 <span className="text-[13px] font-normal text-[#6b7280]">(선택)</span>
          </label>
          <div className="relative">
            <textarea
              id="seller-intro"
              rows="4"
              maxLength={INTRO_MAX_LENGTH}
              placeholder="어떤 식물을 키우는 판매자인지 소개해 주세요. 내 상점에 보여요."
              className="w-full p-4 pb-9 border border-[#d1d5db] text-[15px] leading-relaxed resize-none focus:ring-0 focus:border-[#0f4c3a]"
              value={intro}
              onChange={(event) => onIntroChange(event.target.value)}
              disabled={isSubmitting}
            />
            <span className="absolute right-4 bottom-3 text-[13px] text-[#6b7280] tabular-nums">
              {`${intro.length} / ${INTRO_MAX_LENGTH}`}
            </span>
          </div>
        </div>
        <SellerConsentBox
          key={consentKey}
          policy={consentPolicy}
          agreed={agreed}
          onAgreedChange={onAgreedChange}
          defaultOpen
        />
        <div>
          <div className="flex gap-2">
            <button
              type="button"
              className="h-12 w-[120px] bg-white border border-[#d1d5db] text-sm font-semibold text-[#111827] shrink-0"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="button"
              className={`flex-1 h-12 text-white text-base font-bold ${
                agreed ? 'bg-[#0f4c3a] border border-[#0f4c3a] disabled:opacity-50' : 'bg-[#d1d5db] border border-[#d1d5db] cursor-not-allowed'
              }`}
              onClick={onSubmit}
              disabled={!agreed || isSubmitting}
            >
              {isSubmitting ? '등록 중...' : '판매자 등록하기'}
            </button>
          </div>
          <ActionErrorLine message={errorMessage} />
        </div>
      </section>
    </main>
  );
}

export default SellerRegisterView;

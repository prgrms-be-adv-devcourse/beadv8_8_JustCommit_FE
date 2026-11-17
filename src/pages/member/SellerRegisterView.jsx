import { Link } from 'react-router-dom';
import { ActionErrorLine } from '../../components/common/ActionError';

export const INTRO_MAX_LENGTH = 500;

// 시안 08-1-1 판매자 등록 (화면만, 데이터는 props)
// account: 「국민은행 ***4567 · 예금주 김*식」처럼 완성된 문자열
function SellerRegisterView({
  account,
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
            판매자로 등록하면 바로 식물을 올릴 수 있어요. 정산은 가입할 때 입력한 환급 계좌로 받아요.
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
        <label className="p-4 bg-[#f9fafb] border border-[#e5e7eb] flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="sr-only"
            checked={agreed}
            onChange={(event) => onAgreedChange(event.target.checked)}
          />
          {agreed ? (
            <span className="w-5 h-5 mt-0.5 flex items-center justify-center bg-[#0f4c3a] text-white shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          ) : (
            <span className="w-5 h-5 mt-0.5 bg-white border-2 border-[#d1d5db] shrink-0"></span>
          )}
          <span className="space-y-1">
            <span className="block text-sm font-bold text-[#111827]">
              <span className="text-[#b91c1c]">[필수]</span> 상품 사진 외부 전송(검수) · 학습 이용에 동의해요
            </span>
            <span className="block text-[13px] text-[#4b5563] leading-relaxed">
              올린 상품 사진은 검수를 위해 외부 AI 서비스로 보내고, 검수 품질을 높이는 학습에 쓰여요. 동의해야 판매자로
              등록할 수 있어요.
            </span>
          </span>
        </label>
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
              className="flex-1 h-12 bg-[#0f4c3a] text-white text-base font-bold disabled:opacity-50"
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

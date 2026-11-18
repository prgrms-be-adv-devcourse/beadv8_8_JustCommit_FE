import { Link } from 'react-router-dom';
import { ActionErrorBar } from '../../components/common/ActionError';
import Modal from '../../components/common/Modal';
import ModalButton from '../../components/common/ModalButton';
import PageBackLink from '../../components/common/PageBackLink';
import InfoNote from '../../components/common/InfoNote';
import { SELLER_PRODUCT_BADGE } from '../../constants/seller';

export const APPEAL_MEMO_MAX = 200;

// 검수 단계 표시 (CHECKING일 때만)
function ReviewSteps({ steps }) {
  return (
    <ol className="p-5 bg-[#f9fafb] border border-[#e5e7eb] space-y-3">
      {steps.map((step) => (
        <li key={step.label} className="flex items-center gap-3">
          {step.state === 'done' && (
            <span className="w-6 h-6 flex items-center justify-center bg-[#0f4c3a] text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
          {step.state === 'now' && (
            <span className="w-6 h-6 flex items-center justify-center border-2 border-[#0f4c3a]">
              <span className="w-2 h-2 bg-[#0f4c3a]"></span>
            </span>
          )}
          {step.state === 'wait' && <span className="w-6 h-6 border-2 border-[#d1d5db] block"></span>}
          <span
            className={
              step.state === 'wait'
                ? 'flex-1 text-[15px] text-[#9ca3af]'
                : 'flex-1 text-[15px] text-[#111827] font-semibold'
            }
          >
            {step.label}
          </span>
          <span className="text-[13px] text-[#6b7280]">{step.statusText}</span>
        </li>
      ))}
    </ol>
  );
}

const linkWhite =
  'h-12 w-[160px] flex items-center justify-center bg-white border border-[#d1d5db] text-[15px] font-semibold text-[#111827]';
const linkGreen = 'flex-1 h-12 flex items-center justify-center bg-[#0f4c3a] text-white text-[15px] font-bold';

// 반려 사유 상자
function RejectReason({ review }) {
  return (
    <div className="p-5 bg-[#fef2f2] border border-[#fecaca] space-y-2">
      <p className="text-xs font-bold text-[#b91c1c]">반려 사유</p>
      <p className="text-base font-bold text-[#111827]">{review.reasonTitle}</p>
      <p className="text-sm text-[#4b5563] leading-relaxed">{review.reasonHelp}</p>
      <p className="text-[13px] text-[#6b7280]">{`${review.decidedByLabel} · ${review.decidedAt}`}</p>
    </div>
  );
}

// 시안 08-3-1 ~ 08-3-8 검수 결과 (화면만, 데이터는 props)
// review.stage: CHECKING · PASSED · MANUAL · DELAYED · REJECTED · REJECTED_ADMIN · EXPIRED
// product = { productId, title, speciesName, priceText, createdAtText, photos: [url] }
function ReviewResultView({ review, product, appeal }) {
  const { stage } = review;
  const editPath = `/products/${product.productId}/edit`;
  const badgeKey = {
    CHECKING: 'REVIEW_PENDING',
    PASSED: 'ACTIVE',
    MANUAL: 'MANUAL',
    DELAYED: 'DELAYED',
  }[stage] ?? 'REJECTED';
  const badge = SELLER_PRODUCT_BADGE[badgeKey];
  const isRejected = stage === 'REJECTED' || stage === 'REJECTED_ADMIN' || stage === 'EXPIRED';

  const heading = {
    CHECKING: ['사진을 확인하고 있어요', '보통 몇 초면 끝나요. 이 화면을 닫아도 검수는 계속되고, 결과는 알림으로도 알려 드려요.'],
    PASSED: ['판매를 시작했어요', '검수를 통과해 지금부터 목록과 검색에 보여요.'],
    MANUAL: [
      '관리자가 한 번 더 확인하고 있어요',
      '사진만으로 판단하기 어려워 관리자가 직접 확인해요. 결과는 알림으로 알려 드릴게요. 이 화면을 닫아도 돼요.',
    ],
    DELAYED: ['확인에 시간이 걸리고 있어요', '기다리게 해서 미안해요. 관리자가 확인하는 대로 알림으로 알려 드릴게요.'],
  }[stage] ?? ['검수를 통과하지 못했어요', '아래 사유를 확인하고 상품을 고쳐 다시 검수받을 수 있어요.'];

  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[760px] mx-auto space-y-6">
        <PageBackLink to="/mypage/products" label="내 판매 목록" />
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">검수 결과</h1>
        <section className="bg-white border border-[#e5e7eb] p-8 space-y-5">
          <div className="space-y-2">
            <span className={`h-7 px-2.5 inline-flex items-center text-xs font-semibold ${badge.tone}`}>{badge.label}</span>
            <h2 className="text-xl font-bold text-[#111827]">{heading[0]}</h2>
            <p className="text-[15px] text-[#4b5563] leading-relaxed">{heading[1]}</p>
          </div>

          {stage === 'CHECKING' && <ReviewSteps steps={review.steps} />}

          {stage === 'DELAYED' && (
            <div className="p-4 bg-[#fffbeb] border border-[#fde68a] text-sm text-[#92400e] leading-relaxed">
              <b>{review.expiresAt}</b>까지 확인하지 못하면 자동으로 반려돼요. 이때는 같은 내용으로 바로 다시 검수받을 수 있고,
              재검수 횟수와 등록 제한에 세지 않아요.
            </div>
          )}

          {isRejected && <RejectReason review={review} />}

          {stage === 'PASSED' && (
            <div className="flex gap-2">
              <Link to="/mypage/products" className={linkWhite}>
                내 판매 목록으로
              </Link>
              <Link to={`/products/${product.productId}`} className={linkGreen}>
                상품 보기
              </Link>
            </div>
          )}
          {(stage === 'MANUAL' || stage === 'DELAYED') && (
            <div className="flex gap-2">
              <Link to={editPath} className={linkWhite}>
                상품 수정
              </Link>
              <Link to="/mypage/products" className={linkGreen}>
                내 판매 목록으로
              </Link>
            </div>
          )}
          {stage === 'REJECTED' && (
            <div className="flex gap-2">
              <button
                type="button"
                className="h-12 w-[200px] bg-white border border-[#d1d5db] text-[15px] font-semibold text-[#111827] shrink-0"
                onClick={appeal.onOpen}
              >
                판정이 틀렸어요 · 이의 신청
              </button>
              <Link to={editPath} className={linkGreen}>
                수정해서 다시 검수받기
              </Link>
            </div>
          )}
          {stage === 'REJECTED_ADMIN' && (
            <div className="flex gap-2">
              <Link to={editPath} className={linkGreen}>
                수정해서 다시 검수받기
              </Link>
            </div>
          )}
          {stage === 'EXPIRED' && (
            <div className="flex gap-2">
              <Link to={editPath} className={linkGreen}>
                같은 내용으로 다시 검수받기
              </Link>
            </div>
          )}

          {(stage === 'MANUAL' || stage === 'DELAYED') && <InfoNote>확인 중에 상품을 고치면 검수를 처음부터 다시 해요.</InfoNote>}
          {stage === 'REJECTED' && (
            <InfoNote>{`재검수는 ${review.reReviewLeft}번 남았어요. 이의 신청은 재검수 횟수를 쓰지 않아요.`}</InfoNote>
          )}
          {stage === 'REJECTED_ADMIN' && (
            <InfoNote>{`관리자가 확인한 결과라 이의 신청은 할 수 없어요. 재검수는 ${review.reReviewLeft}번 남았어요.`}</InfoNote>
          )}
          {stage === 'EXPIRED' && <InfoNote>이 반려는 횟수에 세지 않아요.</InfoNote>}
        </section>

        <section className="bg-white border border-[#e5e7eb] p-8 space-y-5">
          <h2 className="text-base font-bold text-[#111827]">검수한 상품</h2>
          <div className="flex gap-3">
            {product.photos.map((url, index) => (
              <div key={url + index} className="relative w-[96px] h-[96px] shrink-0 border border-[#e5e7eb] overflow-hidden">
                <img src={url} alt={`상품 사진 ${index + 1}`} className="w-full h-full object-cover object-center" />
                {index === 0 && (
                  <span className="absolute left-0 top-0 h-6 px-2 flex items-center bg-[#0f4c3a] text-white text-xs font-semibold">
                    대표
                  </span>
                )}
              </div>
            ))}
          </div>
          <dl className="border border-[#e5e7eb] divide-y divide-[#e5e7eb] text-sm">
            <div className="px-4 py-3 flex justify-between">
              <dt className="text-[#6b7280]">상품명</dt>
              <dd className="text-[#111827] font-medium">{product.title}</dd>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <dt className="text-[#6b7280]">선택한 품종</dt>
              <dd className="text-[#111827] font-medium">{product.speciesName}</dd>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <dt className="text-[#6b7280]">가격</dt>
              <dd className="text-[#111827] font-semibold tabular-nums">{product.priceText}</dd>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <dt className="text-[#6b7280]">등록</dt>
              <dd className="text-[#111827] tabular-nums">{product.createdAtText}</dd>
            </div>
          </dl>
        </section>
      </div>

      {appeal.isOpen && (
        <Modal
          title="이의 신청"
          width={520}
          top={160}
          onClose={appeal.onClose}
          footer={
            <>
              <ModalButton onClick={appeal.onClose} disabled={appeal.isSubmitting}>
                취소
              </ModalButton>
              <ModalButton
                variant="primary"
                onClick={appeal.onSubmit}
                disabled={appeal.isSubmitting || appeal.memo.trim() === ''}
              >
                신청하기
              </ModalButton>
            </>
          }
        >
          <p className="text-[#4b5563] leading-relaxed">
            상품을 고치지 않고 관리자에게 다시 확인을 요청해요. 관리자가 사진과 메모를 보고 판단해요.
          </p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <label htmlFor="appeal-memo" className="text-sm font-bold text-[#111827]">
                왜 틀렸다고 생각하는지 적어 주세요
              </label>
              <span className="text-[13px] text-[#6b7280] tabular-nums">{`${appeal.memo.length} / ${APPEAL_MEMO_MAX}`}</span>
            </div>
            <textarea
              id="appeal-memo"
              rows="4"
              maxLength={APPEAL_MEMO_MAX}
              className="w-full p-4 border border-[#0f4c3a] text-[15px] leading-relaxed resize-none focus:ring-0"
              value={appeal.memo}
              onChange={(event) => appeal.onMemoChange(event.target.value)}
              disabled={appeal.isSubmitting}
            />
          </div>
          <ul className="p-4 bg-[#f9fafb] border border-[#e5e7eb] space-y-1.5 text-[13px] text-[#4b5563] leading-relaxed list-disc pl-8">
            <li>이 검수 결과에는 한 번만 신청할 수 있고, 관리자가 반려하면 그 결과가 최종이에요.</li>
            <li>이의 신청은 재검수 횟수를 쓰지 않아요.</li>
            <li>신청한 뒤 상품을 고치면 이의 신청은 끝나고, 자동 검수를 다시 받으며 재검수 1회를 써요.</li>
          </ul>
          <ActionErrorBar message={appeal.errorMessage} />
        </Modal>
      )}
    </main>
  );
}

export default ReviewResultView;

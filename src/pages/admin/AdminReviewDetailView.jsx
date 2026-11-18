import { useState } from 'react';
import ReviewBadge from '../../components/admin/ReviewBadge';
import InfoNote from '../../components/common/InfoNote';
import { ActionErrorLine } from '../../components/common/ActionError';
import { formatDuration } from '../../utils/adminFormat';
import { formatDateTime, formatPrice } from '../../utils/format';
import PageBackLink from '../../components/common/PageBackLink';

// 자리 문구: "{넣을값}"
const P = (text) => `{${text}}`;

// 시안 09-2-2 사진 검수 상세 (AdminReviewDetail)
// review: null이면 자리 문구 (API 응답 모양은 api/adminApi.js 참고)
// onApprove · onReject: 통과 · 반려 버튼. error: 버튼 아래 실패 안내
function AdminReviewDetailView({ review, onApprove, onReject, busy = false, error }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = review?.photos ?? [];
  const engine = review?.engine;
  const badges = review?.badges ?? [{ type: 'DEFAULT', text: P('확인할 이유') }];

  let saleForm = P('판매 형태');
  if (engine)
    saleForm = engine.saleFormIsRejectReason
      ? `${engine.saleForm} · 자동 반려 근거`
      : engine.saleForm;

  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="space-y-6">
        <PageBackLink to="/admin/reviews" label="검수 대기 목록" />
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex gap-1.5">
              {badges.map((badge) => (
                <ReviewBadge key={badge.text} type={badge.type}>
                  {badge.text}
                </ReviewBadge>
              ))}
            </div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              {review?.productName ?? P('상품명')}
            </h1>
            <p className="text-sm text-[#4b5563]">
              {review
                ? `판매자 ${review.sellerNickname} · ${formatPrice(review.price)} · 검수 버전 ${review.reviewVersion}`
                : '판매자 {판매자 닉네임} · {가격} · 검수 버전 {검수 버전}'}
            </p>
          </div>
          <dl className="px-5 py-3 bg-[#f9fafb] border border-[#e5e7eb] text-sm space-y-1 shrink-0">
            <div className="flex gap-6 justify-between">
              <dt className="text-[#6b7280]">기다린 시간</dt>
              <dd className="font-semibold tabular-nums">
                {review ? formatDuration(review.waitedMinutes) : P('기다린 시간')}
              </dd>
            </div>
            <div className="flex gap-6 justify-between">
              <dt className="text-[#6b7280]">자동 반려까지</dt>
              <dd className="font-semibold tabular-nums">
                {review ? formatDuration(review.remainingMinutes) : P('남은 시간')}
              </dd>
            </div>
          </dl>
        </div>
        <div className="grid grid-cols-[1fr_440px] gap-6 items-start">
          <section className="bg-white border border-[#e5e7eb] p-5 space-y-3">
            <div className="aspect-square border border-[#e5e7eb] overflow-hidden">
              {photos[photoIndex] && (
                <img
                  src={photos[photoIndex]}
                  alt={`상품 사진 ${photoIndex + 1} / ${photos.length}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex gap-2">
              {photos.map((url, index) => (
                <button
                  key={`${index}-${url}`}
                  type="button"
                  className={
                    index === photoIndex
                      ? 'w-16 h-16 border border-2 border-[#0f4c3a] overflow-hidden'
                      : 'w-16 h-16 border border-[#e5e7eb] overflow-hidden'
                  }
                  onClick={() => setPhotoIndex(index)}
                >
                  <img
                    src={url}
                    alt={`사진 ${index + 1} 보기`}
                    className="w-full h-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          </section>
          <div className="space-y-4">
            {review?.appeal && (
              <section className="bg-white border border-[#e5e7eb] p-5 space-y-2">
                <h2 className="text-sm font-bold text-[#111827]">
                  판매자 이의 신청 메모{' '}
                  <span className="font-normal text-[#6b7280]">{`· ${formatDateTime(review.appeal.createdAt)}`}</span>
                </h2>
                <p className="text-sm text-[#111827] leading-relaxed">{review.appeal.memo}</p>
              </section>
            )}
            <section className="bg-white border border-[#e5e7eb] p-5 space-y-2">
              <h2 className="text-sm font-bold text-[#111827]">엔진 결과</h2>
              <dl className="border border-[#e5e7eb] divide-y divide-[#e5e7eb] text-sm">
                <div className="px-4 py-2.5 flex justify-between">
                  <dt className="text-[#6b7280]">유해 검사</dt>
                  <dd className="text-[#111827]">{engine?.harmful ?? P('유해 검사 결과')}</dd>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <dt className="text-[#6b7280]">식물 여부</dt>
                  <dd className="text-[#111827]">{engine?.plant ?? P('식물 여부')}</dd>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <dt className="text-[#6b7280]">판매 형태</dt>
                  <dd
                    className={
                      engine?.saleFormIsRejectReason
                        ? 'font-semibold text-[#b91c1c]'
                        : 'text-[#111827]'
                    }
                  >
                    {saleForm}
                  </dd>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <dt className="text-[#6b7280]">금지 의심</dt>
                  <dd className="text-[#111827]">{engine?.bannedSuspect ?? P('금지 의심 사유')}</dd>
                </div>
              </dl>
            </section>
            <section className="bg-white border border-[#e5e7eb] p-5 space-y-2">
              <h2 className="text-sm font-bold text-[#111827]">
                품종 후보{' '}
                <span className="font-normal text-[#6b7280]">
                  {`(판매자 선택: ${review?.selectedSpeciesName ?? P('선택 품종')})`}
                </span>
              </h2>
              <ol className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
                {(review?.candidates ?? []).map((candidate, index) => (
                  <li key={candidate.scientificName} className="px-4 py-3 flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-[#f3f4f6] text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm text-[#111827] italic">
                        {candidate.scientificName}
                      </span>
                      <span className="block text-xs text-[#6b7280]">
                        {candidate.matchNote ? `${candidate.koreanName} · ` : candidate.koreanName}
                        {candidate.matchNote && (
                          <span className="text-[#0f4c3a] font-semibold">
                            {candidate.matchNote}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="text-sm font-bold tabular-nums">{`${candidate.percent}%`}</span>
                  </li>
                ))}
              </ol>
            </section>
            <section className="bg-white border border-[#e5e7eb] p-5 space-y-2">
              <h2 className="text-sm font-bold text-[#111827]">판매자가 쓴 내용</h2>
              <p className="text-sm text-[#111827] leading-relaxed">
                {review?.description ?? P('상품 설명')}
              </p>
            </section>
            <section className="bg-white border border-[#e5e7eb] p-5 space-y-2">
              <h2 className="text-sm font-bold text-[#111827]">검수 기록</h2>
              <ol className="space-y-1.5 text-sm">
                {(review?.history ?? []).map((item) => (
                  <li key={`${item.time}-${item.text}`} className="flex gap-3">
                    <span className="w-12 text-[#6b7280] tabular-nums">{item.time}</span>
                    <span className="text-[#111827]">{item.text}</span>
                  </li>
                ))}
              </ol>
            </section>
            <InfoNote>
              판매자가 고른 품종은 바꿀 수 없어요. 품종이 틀렸으면 &quot;선택한 품종과
              다름&quot;으로 반려해 주세요. 이의 신청 건은 반려하면 그 결과가 최종이에요.
            </InfoNote>
            <div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 h-12 bg-white border border-[#b91c1c] text-[15px] font-bold text-[#b91c1c]"
                  onClick={onReject}
                  disabled={busy || !review}
                >
                  반려
                </button>
                <button
                  type="button"
                  className="flex-1 h-12 bg-[#0f4c3a] text-white text-[15px] font-bold"
                  onClick={onApprove}
                  disabled={busy || !review}
                >
                  통과
                </button>
              </div>
              <ActionErrorLine message={error} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminReviewDetailView;

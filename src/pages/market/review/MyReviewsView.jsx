import { Link } from 'react-router-dom';
import { ActionErrorBar, ActionErrorLine } from '../../../components/common/ActionError';
import Modal from '../../../components/common/Modal';
import ModalButton from '../../../components/common/ModalButton';
import PageBackLink from '../../../components/common/PageBackLink';
import UnderlineTab from '../../../components/common/UnderlineTab';
import LoadMoreButton from '../../../components/review/LoadMoreButton';
import ReviewCard from '../../../components/review/ReviewCard';
import Stars, { StarIcon } from '../../../components/review/Stars';

// 시안 05-3 리뷰 관리: 05-3-1 내가 쓴 리뷰 · 05-3-2 삭제 확인 · 05-3-3 쓸 수 있는 리뷰 · 05-3-4 받은 리뷰(판매자)
// 05-3-5 ~ 05-3-7 빈 상태
// tabs = [{ key, label, count(undefined면 칩 숨김) }], activeTab
// written = { loadState, items: toMyReviewItem[], hasMore, isLoadingMore, loadMoreError }
// writable = { loadState, items: toWritableItem[] }
// received = { loadState, summary: buildReceivedSummary | null, tagChips, cards, hasMore, isLoadingMore, loadMoreError }
// deleteTarget = { sellerName } | null, deleting, deleteError

const LOAD_ERROR = '리뷰를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';

function EmptyState({ title, text }) {
  return (
    <div className="bg-white border border-[#e5e7eb] px-6 py-24 flex flex-col items-center text-center gap-3">
      <div className="w-16 h-16 bg-[#f4f8f6] border border-[#d1e7dd] flex items-center justify-center">
        <StarIcon className="w-8 h-8 text-[#0f4c3a]" />
      </div>
      <h2 className="mt-2 text-xl font-bold text-[#111827]">{title}</h2>
      <p className="text-[15px] text-[#4b5563]">{text}</p>
    </div>
  );
}

function WrittenTab({ written, onLoadMore, onDelete }) {
  if (written.loadState === 'error') return <ActionErrorLine message={LOAD_ERROR} className="" />;
  if (written.loadState !== 'done') return null;
  if (written.items.length === 0) {
    return (
      <EmptyState
        title="아직 쓴 리뷰가 없어요"
        text="구매를 확정하면 쓸 수 있는 리뷰 탭에 나와요."
      />
    );
  }
  return (
    <>
      <p className="text-[13px] text-[#6b7280]">
        리뷰는 수정할 수 없어요. 작성 후 3일 안에만 삭제할 수 있고, 삭제한 주문에는 다시 쓸 수
        없어요.
      </p>
      <ul className="space-y-6">
        {written.items.map((item) => (
          <li key={item.key} className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[15px] font-bold text-[#111827]">{item.sellerName}</span>
              <span className="text-[13px] text-[#6b7280] tabular-nums">{item.orderedText}</span>
              {item.deletable ? (
                <>
                  <span className="ml-auto text-[13px] text-[#92400e]">
                    {item.deleteDeadlineText}
                  </span>
                  <button
                    type="button"
                    className="h-9 w-[72px] flex items-center justify-center bg-white border border-[#d1d5db] text-sm font-semibold text-[#b91c1c]"
                    onClick={() => onDelete(item)}
                  >
                    삭제
                  </button>
                </>
              ) : (
                <span className="ml-auto text-[13px] text-[#9ca3af]">
                  삭제할 수 있는 기간(작성 후 3일)이 지났어요
                </span>
              )}
            </div>
            <ReviewCard review={item.card} />
          </li>
        ))}
      </ul>
      <LoadMoreButton
        hasMore={written.hasMore}
        isLoading={written.isLoadingMore}
        onClick={onLoadMore}
        errorMessage={written.loadMoreError}
      />
    </>
  );
}

function WritableTab({ writable }) {
  if (writable.loadState === 'error') return <ActionErrorLine message={LOAD_ERROR} className="" />;
  if (writable.loadState !== 'done') return null;
  if (writable.items.length === 0) {
    return (
      <EmptyState
        title="지금 쓸 수 있는 리뷰가 없어요"
        text="판매자의 상품을 모두 구매 확정하면 3일 동안 리뷰를 쓸 수 있어요."
      />
    );
  }
  return (
    <>
      <p className="text-[13px] text-[#6b7280]">구매 확정 후 3일이 지나면 쓸 수 없어요.</p>
      <ul className="space-y-3">
        {writable.items.map((item) => (
          <li key={item.key} className="bg-white border border-[#e5e7eb] p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[15px] font-bold text-[#111827]">{item.sellerName}</span>
              <span className="text-[13px] text-[#6b7280] tabular-nums">{item.metaText}</span>
              <span className="ml-auto h-7 px-2.5 flex items-center bg-[#fffbeb] border border-[#fde68a] text-[13px] font-semibold text-[#92400e]">
                {item.deadlineText}
              </span>
            </div>
            {/* 시안의 상품 사진은 작성 가능 목록 API에 없어 이름만 */}
            <div className="flex flex-wrap items-center gap-4">
              <ul className="flex-1 min-w-[160px] space-y-2">
                {item.productNames.map((name) => (
                  <li key={name} className="text-[15px] font-medium text-[#111827]">
                    {name}
                  </li>
                ))}
              </ul>
              <Link
                to={item.writeTo}
                state={{ from: 'mypage' }}
                className="h-10 px-5 flex items-center bg-[#0f4c3a] text-white text-sm font-bold"
              >
                리뷰 작성
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function ReceivedTab({ received, onLoadMore }) {
  if (received.loadState === 'error') return <ActionErrorLine message={LOAD_ERROR} className="" />;
  if (received.loadState !== 'done') return null;
  const { summary } = received;
  if (received.cards.length === 0) {
    return (
      <EmptyState
        title="아직 받은 리뷰가 없어요"
        text="구매자가 리뷰를 남기면 여기에서 볼 수 있어요."
      />
    );
  }
  return (
    <>
      <section
        className="bg-white border border-[#e5e7eb] p-6 space-y-5"
        aria-label="받은 리뷰 요약"
      >
        <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
          <div className="flex flex-col items-center gap-1 min-w-[120px]">
            <p className="text-4xl font-black text-[#0f4c3a] tracking-tight">
              {summary.averageText}
            </p>
            <Stars rating={summary.average} />
            <p className="text-sm text-[#6b7280]">{summary.countText}</p>
          </div>
          <ul className="flex-1 min-w-[200px] space-y-2" aria-label="별점별 리뷰 수">
            {summary.bars.map((bar) => (
              <li key={bar.key} className="flex items-center gap-3 text-[13px] tabular-nums">
                <span className="w-10 text-[#4b5563]">{bar.label}</span>
                <span className="flex-1 h-2 bg-[#f3f4f6]">
                  <span className="block h-2 bg-[#0f4c3a]" style={{ width: `${bar.percent}%` }} />
                </span>
                <span className="w-6 text-right font-semibold text-[#111827]">{bar.count}</span>
              </li>
            ))}
          </ul>
        </div>
        {received.tagChips.length > 0 && (
          <div className="pt-4 border-t border-[#e5e7eb] space-y-2">
            <p className="text-sm font-bold text-[#111827]">구매자가 고른 좋은 점</p>
            <div className="flex flex-wrap gap-2">
              {received.tagChips.map((tag) => (
                <span
                  key={tag.label}
                  className="h-8 px-3 flex items-center gap-1.5 bg-[#f4f8f6] border border-[#d1e7dd] text-[13px] text-[#0f4c3a]"
                >
                  {tag.label}
                  <span className="font-bold">{tag.count.toLocaleString('ko-KR')}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
      <div className="space-y-3">
        {received.cards.map((card) => (
          <ReviewCard key={card.key} review={card} />
        ))}
      </div>
      <LoadMoreButton
        hasMore={received.hasMore}
        isLoading={received.isLoadingMore}
        onClick={onLoadMore}
        errorMessage={received.loadMoreError}
      />
    </>
  );
}

function MyReviewsView({
  tabs,
  activeTab,
  onChangeTab,
  written,
  writable,
  received,
  onLoadMoreWritten,
  onLoadMoreReceived,
  deleteTarget,
  deleting,
  deleteError,
  onOpenDelete,
  onCloseDelete,
  onConfirmDelete,
}) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[960px] mx-auto space-y-6">
        <PageBackLink to="/mypage" label="마이페이지" />
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">리뷰 관리</h1>
        <div
          className="flex border-b border-[#e5e7eb] overflow-x-auto"
          role="tablist"
          aria-label="리뷰 관리"
        >
          {tabs.map((tab) => (
            <UnderlineTab
              key={tab.key}
              role="tab"
              aria-selected={tab.key === activeTab}
              active={tab.key === activeTab}
              count={tab.count}
              onClick={() => onChangeTab(tab.key)}
            >
              {tab.label}
            </UnderlineTab>
          ))}
        </div>
        {activeTab === 'written' && (
          <WrittenTab written={written} onLoadMore={onLoadMoreWritten} onDelete={onOpenDelete} />
        )}
        {activeTab === 'writable' && <WritableTab writable={writable} />}
        {activeTab === 'received' && (
          <ReceivedTab received={received} onLoadMore={onLoadMoreReceived} />
        )}
      </div>
      {deleteTarget && (
        <Modal
          title="리뷰를 삭제할까요?"
          width={400}
          top={180}
          bodyClassName="space-y-3"
          onClose={onCloseDelete}
          footer={
            <>
              <ModalButton fit onClick={onCloseDelete} disabled={deleting}>
                취소
              </ModalButton>
              <ModalButton fit variant="danger" onClick={onConfirmDelete} disabled={deleting}>
                {deleting ? '삭제하는 중...' : '삭제'}
              </ModalButton>
            </>
          }
        >
          <p className="text-[#4b5563] leading-relaxed">
            {`${deleteTarget.sellerName} 판매자에게 쓴 리뷰예요. 삭제하면 되돌릴 수 없고, 이 주문에는 리뷰를 다시 쓸 수 없어요.`}
          </p>
          <ActionErrorBar message={deleteError} />
        </Modal>
      )}
    </main>
  );
}

export default MyReviewsView;

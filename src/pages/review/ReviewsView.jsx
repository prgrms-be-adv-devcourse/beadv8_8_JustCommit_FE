import { Link } from 'react-router-dom';
import { ActionErrorBar } from '../../components/common/ActionError';
import Modal from '../../components/common/Modal';
import ModalButton from '../../components/common/ModalButton';
import PageBackLink from '../../components/common/PageBackLink';
import UnderlineTab from '../../components/common/UnderlineTab';
import ReviewCard from '../../components/review/ReviewCard';
import Stars, { StarIcon } from '../../components/review/Stars';
import { getTagLabel } from '../../constants/review';

// 시안 05-3-1 ~ 7 리뷰 관리 (내가 쓴 리뷰 · 쓸 수 있는 리뷰 · 받은 리뷰(판매자) · 삭제 모달 · 빈 화면 3종)
// props
//   isSeller, tab('written'|'writable'|'received'), onTabChange, counts{ written, writable, received }
//   written = [{ reviewId, sellerNickname, orderedDateText, deletableUntilText(null = 기간 지남), card }]
//   writable = [{ key, to, sellerNickname, dateText, writableUntilText, items[{ productName, thumbnailUrl }] }]
//   received = { averageText, average, totalCount, ratingRows[{ label, percent, count }], tagCounts[{ tag, count }], cards[] }
//   deleteTarget(written 항목 | null), onDeleteClick, onDeleteConfirm, onDeleteCancel, isDeleting, deleteError

const EMPTY_TEXT = {
  written: { title: '아직 쓴 리뷰가 없어요', text: '구매를 확정하면 쓸 수 있는 리뷰 탭에 나와요.' },
  writable: { title: '지금 쓸 수 있는 리뷰가 없어요', text: '판매자의 상품을 모두 구매 확정하면 3일 동안 리뷰를 쓸 수 있어요.' },
  received: { title: '아직 받은 리뷰가 없어요', text: '구매자가 리뷰를 남기면 여기에서 볼 수 있어요.' },
};

function EmptyBox({ tab }) {
  return (
    <div className="bg-white border border-[#e5e7eb] px-6 py-24 flex flex-col items-center text-center gap-3">
      <div className="w-16 h-16 bg-[#f4f8f6] border border-[#d1e7dd] flex items-center justify-center">
        <StarIcon className="w-8 h-8 text-[#0f4c3a]" />
      </div>
      <h2 className="mt-2 text-xl font-bold text-[#111827]">{EMPTY_TEXT[tab].title}</h2>
      <p className="text-[15px] text-[#4b5563]">{EMPTY_TEXT[tab].text}</p>
    </div>
  );
}

function WrittenList({ written, onDeleteClick }) {
  return (
    <>
      <p className="text-[13px] text-[#6b7280]">
        리뷰는 수정할 수 없어요. 작성 후 3일 안에만 삭제할 수 있고, 삭제한 주문에는 다시 쓸 수 없어요.
      </p>
      <ul className="space-y-6">
        {written.map((item) => (
          <li key={item.reviewId} className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[15px] font-bold text-[#111827]">{item.sellerNickname}</span>
              <span className="text-[13px] text-[#6b7280] tabular-nums">{`${item.orderedDateText} 주문`}</span>
              {item.deletableUntilText ? (
                <>
                  <span className="ml-auto text-[13px] text-[#92400e]">{`${item.deletableUntilText}까지 삭제할 수 있어요`}</span>
                  <button
                    type="button"
                    className="h-9 w-[72px] flex items-center justify-center bg-white border border-[#d1d5db] text-sm font-semibold text-[#b91c1c]"
                    onClick={() => onDeleteClick(item)}
                  >
                    삭제
                  </button>
                </>
              ) : (
                <span className="ml-auto text-[13px] text-[#9ca3af]">삭제할 수 있는 기간(작성 후 3일)이 지났어요</span>
              )}
            </div>
            <ReviewCard review={item.card} />
          </li>
        ))}
      </ul>
    </>
  );
}

function WritableList({ writable }) {
  return (
    <>
      <p className="text-[13px] text-[#6b7280]">구매 확정 후 3일이 지나면 쓸 수 없어요.</p>
      <ul className="space-y-3">
        {writable.map((item) => (
          <li key={item.key} className="bg-white border border-[#e5e7eb] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[15px] font-bold text-[#111827]">{item.sellerNickname}</span>
              <span className="text-[13px] text-[#6b7280] tabular-nums">{item.dateText}</span>
              <span className="ml-auto h-7 px-2.5 flex items-center bg-[#fffbeb] border border-[#fde68a] text-[13px] font-semibold text-[#92400e]">
                {`${item.writableUntilText}까지 작성 가능`}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ul className="flex-1 space-y-2">
                {item.items.map((product) => (
                  <li key={product.productName} className="flex items-center gap-3">
                    <img src={product.thumbnailUrl} alt={product.productName} className="w-14 h-14 object-cover border border-[#e5e7eb]" />
                    <span className="text-[15px] font-medium text-[#111827]">{product.productName}</span>
                  </li>
                ))}
              </ul>
              <Link to={item.to} className="h-10 px-5 flex items-center bg-[#0f4c3a] text-white text-sm font-bold">
                리뷰 작성
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function ReceivedSummary({ received }) {
  return (
    <section className="bg-white border border-[#e5e7eb] p-6 space-y-5">
      <div className="flex items-center gap-10">
        <div className="flex flex-col items-center gap-1 min-w-[120px]">
          <p className="text-4xl font-black text-[#0f4c3a] tracking-tight">{received.averageText}</p>
          <Stars rating={received.average} />
          <p className="text-sm text-[#6b7280]">{`리뷰 ${received.totalCount}개`}</p>
        </div>
        <ul className="flex-1 space-y-2">
          {received.ratingRows.map((row) => (
            <li key={row.label} className="flex items-center gap-3 text-[13px] tabular-nums">
              <span className="w-10 text-[#4b5563]">{row.label}</span>
              <span className="flex-1 h-2 bg-[#f3f4f6]">
                <span className="block h-2 bg-[#0f4c3a]" style={{ width: `${row.percent}%` }} />
              </span>
              <span className="w-6 text-right font-semibold text-[#111827]">{row.count}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="pt-4 border-t border-[#e5e7eb] space-y-2">
        <p className="text-sm font-bold text-[#111827]">구매자가 고른 좋은 점</p>
        <div className="flex flex-wrap gap-2">
          {received.tagCounts.map(({ tag, count }) => (
            <span key={tag} className="h-8 px-3 flex items-center gap-1.5 bg-[#f4f8f6] border border-[#d1e7dd] text-[13px] text-[#0f4c3a]">
              {getTagLabel(tag)}
              <span className="font-bold">{count}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewsView({
  isSeller,
  tab,
  onTabChange,
  counts,
  written,
  writable,
  received,
  deleteTarget,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  isDeleting,
  deleteError,
}) {
  const renderBody = () => {
    if (tab === 'written') {
      return written.length === 0 ? <EmptyBox tab="written" /> : <WrittenList written={written} onDeleteClick={onDeleteClick} />;
    }
    if (tab === 'writable') {
      return writable.length === 0 ? <EmptyBox tab="writable" /> : <WritableList writable={writable} />;
    }
    if (!received || received.totalCount === 0) return <EmptyBox tab="received" />;
    return (
      <>
        <ReceivedSummary received={received} />
        <div className="space-y-3">
          {received.cards.map((card) => (
            <ReviewCard key={card.reviewId} review={card} />
          ))}
        </div>
      </>
    );
  };

  return (
    <>
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
        <div className="max-w-[960px] mx-auto space-y-6">
          <PageBackLink to="/mypage" label="마이페이지" />
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">리뷰 관리</h1>
          <div className="flex border-b border-[#e5e7eb]">
            <UnderlineTab active={tab === 'written'} count={counts.written} onClick={() => onTabChange('written')}>
              내가 쓴 리뷰
            </UnderlineTab>
            <UnderlineTab active={tab === 'writable'} count={counts.writable} onClick={() => onTabChange('writable')}>
              쓸 수 있는 리뷰
            </UnderlineTab>
            {isSeller && (
              <UnderlineTab active={tab === 'received'} count={counts.received} onClick={() => onTabChange('received')}>
                받은 리뷰
              </UnderlineTab>
            )}
          </div>
          {renderBody()}
        </div>
      </main>
      {deleteTarget && (
        <Modal
          title="리뷰를 삭제할까요?"
          width={400}
          bodyClassName="space-y-3"
          onClose={onDeleteCancel}
          footer={
            <>
              <ModalButton fit onClick={onDeleteCancel}>
                취소
              </ModalButton>
              <ModalButton fit variant="danger" onClick={onDeleteConfirm} disabled={isDeleting}>
                삭제
              </ModalButton>
            </>
          }
        >
          <p className="text-[#4b5563] leading-relaxed">
            {`${deleteTarget.sellerNickname} 판매자에게 쓴 리뷰예요. 삭제하면 되돌릴 수 없고, 이 주문에는 리뷰를 다시 쓸 수 없어요.`}
          </p>
          <ActionErrorBar message={deleteError} />
        </Modal>
      )}
    </>
  );
}

export default ReviewsView;

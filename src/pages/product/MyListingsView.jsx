import { Link } from 'react-router-dom';
import { ActionErrorBar } from '../../components/common/ActionError';
import Modal from '../../components/common/Modal';
import ModalButton from '../../components/common/ModalButton';
import { CountTabs, InfoNote, PageBackLink, QuotaBar } from '../../components/seller/SellerParts';
import { SELLER_PRODUCT_BADGE } from '../../constants/seller';

const btnOn = 'h-9 w-[88px] text-sm font-semibold bg-white border border-[#d1d5db] text-[#111827]';
const btnDanger = 'h-9 w-[88px] text-sm font-semibold bg-white border border-[#d1d5db] text-[#b91c1c]';
const btnOff = 'h-9 w-[88px] text-sm font-semibold bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed';

function LeafIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14zm0 0l7-7" />
    </svg>
  );
}

// 상품 한 줄
// row = { productId, title, priceText, thumbnailUrl, badges: [키], note, link: { label, to },
//         canEdit, hideAction: 'hide' | 'unhide' | null, canDelete }
function ListingRow({ row, busy, onEdit, onToggleHidden, onDelete }) {
  return (
    <li className="p-5 bg-white border border-[#e5e7eb] flex items-center gap-5">
      {row.thumbnailUrl ? (
        <div className="w-20 h-20 shrink-0 border border-[#e5e7eb] overflow-hidden">
          <img src={row.thumbnailUrl} alt={row.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-20 h-20 shrink-0 border border-[#e5e7eb] bg-[#f3f4f6] flex items-center justify-center">
          <LeafIcon className="w-8 h-8 text-[#9ca3af]" />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-1.5">
          {row.badges.map((key) => (
            <span
              key={key}
              className={`h-6 px-2 inline-flex items-center text-xs font-semibold ${SELLER_PRODUCT_BADGE[key].tone}`}
            >
              {SELLER_PRODUCT_BADGE[key].label}
            </span>
          ))}
        </div>
        <p className="text-[15px] font-semibold text-[#111827] truncate">{row.title}</p>
        <p className="text-base font-bold text-[#111827] tabular-nums">{row.priceText}</p>
        {row.note && <p className="text-[13px] text-[#4b5563]">{row.note}</p>}
        {row.link && (
          <>
            {' '}
            <Link to={row.link.to} className="text-[13px] font-semibold text-[#0f4c3a] underline">
              {row.link.label}
            </Link>
          </>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          className={row.canEdit ? btnOn : btnOff}
          disabled={!row.canEdit || busy}
          onClick={() => onEdit(row)}
        >
          수정
        </button>
        {row.hideAction && (
          <button type="button" className={btnOn} disabled={busy} onClick={() => onToggleHidden(row)}>
            {row.hideAction === 'unhide' ? '숨김 해제' : '숨기기'}
          </button>
        )}
        <button
          type="button"
          className={row.canDelete ? btnDanger : btnOff}
          disabled={!row.canDelete || busy}
          onClick={() => onDelete(row)}
        >
          삭제
        </button>
      </div>
    </li>
  );
}

// 시안 08-4-1 ~ 08-4-4 내 판매 목록 (화면만, 데이터는 props)
function MyListingsView({
  quota,
  tabs,
  tab,
  onTabChange,
  rows,
  isEmptyAll,
  busyId,
  onEdit,
  onToggleHidden,
  onDelete,
  deleteTarget,
  onDeleteCancel,
  onDeleteConfirm,
  notice,
  onNoticeClose,
}) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[1040px] mx-auto space-y-6">
        <PageBackLink to="/mypage" label="마이페이지" />
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">내 판매 목록</h1>
          <Link
            to="/products/new"
            className="h-10 w-[120px] flex items-center justify-center bg-[#0f4c3a] text-white text-sm font-semibold"
          >
            + 상품 등록
          </Link>
        </div>
        <QuotaBar quota={quota} />
        <CountTabs tabs={tabs} value={tab} onChange={onTabChange} />
        {rows.length > 0 ? (
          <ul className="space-y-3">
            {rows.map((row) => (
              <ListingRow
                key={row.productId}
                row={row}
                busy={busyId === row.productId}
                onEdit={onEdit}
                onToggleHidden={onToggleHidden}
                onDelete={onDelete}
              />
            ))}
          </ul>
        ) : (
          <div className="bg-white border border-[#e5e7eb] px-6 py-20 flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 bg-[#f4f8f6] border border-[#d1e7dd] flex items-center justify-center">
              <LeafIcon className="w-8 h-8 text-[#0f4c3a]" />
            </div>
            <h2 className="mt-2 text-xl font-bold text-[#111827]">
              {isEmptyAll ? '아직 등록한 식물이 없어요' : '이 상태의 상품이 없어요'}
            </h2>
            <p className="text-[15px] text-[#4b5563]">
              {isEmptyAll ? '판매할 식물을 등록해 보세요.' : '다른 탭에서 상품을 확인해 보세요.'}
            </p>
            {isEmptyAll && (
              <Link
                to="/products/new"
                className="mt-2 h-11 w-[160px] flex items-center justify-center bg-[#0f4c3a] text-white text-sm font-semibold"
              >
                상품 등록
              </Link>
            )}
          </div>
        )}
        <InfoNote>
          수정과 삭제는 판매 중 · 검수 중 · 반려 상품만 할 수 있어요. 검수 중이거나 반려된 상품은 원래 다른 사람에게 보이지
          않아서 숨길 수 없어요.
        </InfoNote>
      </div>

      {deleteTarget && (
        <Modal
          title="상품을 삭제할까요?"
          onClose={onDeleteCancel}
          footer={
            <>
              <ModalButton onClick={onDeleteCancel}>취소</ModalButton>
              <ModalButton variant="danger" onClick={onDeleteConfirm}>
                삭제
              </ModalButton>
            </>
          }
        >
          <p className="text-[#4b5563] leading-relaxed">
            <span className="font-semibold text-[#111827]">{deleteTarget.title}</span>을(를) 삭제하면 목록에서 사라지고 되돌릴 수
            없어요.
          </p>
        </Modal>
      )}
      {notice && (
        <Modal
          title="처리하지 못했어요"
          onClose={onNoticeClose}
          footer={
            <ModalButton variant="primary" onClick={onNoticeClose}>
              확인
            </ModalButton>
          }
        >
          <ActionErrorBar message={notice} />
        </Modal>
      )}
    </main>
  );
}

export default MyListingsView;

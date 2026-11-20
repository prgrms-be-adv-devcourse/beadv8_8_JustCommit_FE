import { Link } from 'react-router-dom';
import ProductThumbnail from '../../components/product/ProductThumbnail';
import { ActionErrorLine } from '../../components/common/ActionError';
import { formatPrice, toValidDate } from '../../utils/format';
import { EMPTY } from '../../constants/emptyText';

// 상품 상세 화면 (시안 02-2-1 판매 중 · 02-2-2 거래 중 · 02-2-3 판매 완료 · 02-2-4 내 상품 · 02-2-5 내 상품 숨김 · 02-2-6 내 상품 거래 중)
// 데이터와 동작은 ProductDetailPage가 props로 넘김

// 상태 배지 (용어: docs glossary 「판매 중」 · 「거래 중」 · 「판매 완료」)
const STATUS_BADGE = {
  ACTIVE: { label: '판매 중', className: 'inline-flex items-center px-2.5 py-0.5 bg-[#0f4c3a] text-white text-xs font-bold' },
  PAYMENT_PENDING: {
    label: '거래 중',
    className: 'inline-flex items-center px-2.5 py-0.5 bg-white border border-[#0f4c3a] text-[#0f4c3a] text-xs font-bold',
  },
  SOLD_OUT: { label: '판매 완료', className: 'inline-flex items-center px-2.5 py-0.5 bg-[#000000] text-white text-xs font-bold' },
  // 검수 중 · 반려는 본인만 볼 수 있음 (남이 열면 BE가 404)
  REVIEW_PENDING: {
    label: '검수 중',
    className: 'inline-flex items-center px-2.5 py-0.5 bg-[#f4f8f6] border border-[#d1e7dd] text-[#0f4c3a] text-xs font-bold',
  },
  REJECTED: {
    label: '반려',
    className: 'inline-flex items-center px-2.5 py-0.5 bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-xs font-bold',
  },
};

// 검수 결과 화면으로 가는 링크를 보여 줄 상태
const REVIEW_STATUSES = ['REVIEW_PENDING', 'REJECTED'];

// 큰 사진 위 덮개 (거래 중 · 판매 완료)
const PHOTO_OVERLAY = {
  PAYMENT_PENDING: {
    dimClass: 'absolute inset-0 bg-black/30 flex items-center justify-center',
    badgeClass: 'px-4 py-1.5 bg-[#0f4c3a] border-2 border-white text-white text-sm font-bold tracking-wider',
    label: 'RESERVED',
  },
  SOLD_OUT: {
    dimClass: 'absolute inset-0 bg-black/60 flex items-center justify-center',
    badgeClass: 'px-4 py-1.5 bg-[#000000] border-2 border-white text-white text-sm font-bold tracking-wider',
    label: 'SOLD OUT',
  },
};

// 구매할 수 없을 때 버튼 아래 안내
const BLOCKED_TEXT = {
  PAYMENT_PENDING: '다른 회원이 거래 중인 상품이라 지금은 구매할 수 없어요.',
  SOLD_OUT: '판매가 완료된 상품이에요.',
};

const PRIMARY_BUTTON =
  'h-12 px-6 bg-[#0f4c3a] hover:bg-[#083226] text-white text-base font-bold flex items-center justify-center transition-colors';
const SECONDARY_BUTTON =
  'h-12 px-6 bg-white hover:bg-[#f9fafb] text-[#111827] border border-[#d1d5db] text-base font-bold flex items-center justify-center gap-2 transition-colors';

function CartIcon() {
  return (
    <svg className="w-5 h-5 text-[#111827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

// 2026-10-13T... → 2026년 10월 13일
function formatKoreanDate(value) {
  const date = toValidDate(value);
  if (!date) return EMPTY;
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function Gallery({ product, images, selected, onSelectImage }) {
  const isSoldOut = product.status === 'SOLD_OUT';
  const gray = isSoldOut ? ' grayscale' : '';
  const overlay = PHOTO_OVERLAY[product.status];

  return (
    <div className="lg:col-span-7 flex flex-col gap-4">
      <div className="relative w-full aspect-square bg-[#f4f4f5] border border-[#e5e7eb] overflow-hidden">
        <ProductThumbnail src={images[selected]} alt={product.title} className={`w-full h-full object-cover${gray}`} />
        {overlay && (
          <div className={overlay.dimClass}>
            <span className={overlay.badgeClass}>{overlay.label}</span>
          </div>
        )}
        {images.length > 0 && (
          <div className="absolute bottom-3 right-3 bg-[#0f4c3a] text-white text-xs px-2.5 py-1 font-medium tracking-wide">
            {`${selected + 1} / ${images.length}`}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((url, index) =>
            index === selected ? (
              <button
                key={url}
                type="button"
                className="relative aspect-square border-2 border-[#0f4c3a] overflow-hidden bg-[#f4f4f5] focus:outline-none"
                aria-pressed="true"
                onClick={() => onSelectImage(index)}
              >
                <img src={url} alt={`썸네일 ${index + 1}`} className={`w-full h-full object-cover${gray}`} />
              </button>
            ) : (
              <button
                key={url}
                type="button"
                className="relative aspect-square border border-[#e5e7eb] hover:border-[#0f4c3a] overflow-hidden bg-[#f4f4f5] transition-colors focus:outline-none"
                aria-pressed="false"
                onClick={() => onSelectImage(index)}
              >
                <img
                  src={url}
                  alt={`썸네일 ${index + 1}`}
                  className={`w-full h-full object-cover opacity-90 hover:opacity-100${gray}`}
                />
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// 구매 버튼 줄. 내 상품은 구매 · 장바구니 대신 수정 · 숨기기 · 삭제 (시안 02-2-4, 서버도 OWN_PRODUCT로 주문을 막음)
// 숨긴 상품은 「숨김 해제」 (02-2-5), 거래 중 · 판매 완료는 수정 · 삭제 없이 숨기기만 (02-2-6)
const OWNER_LOCKED = ['PAYMENT_PENDING', 'SOLD_OUT'];

function Actions({ product, isOwner, isBusy, actionError, onBuy, onAddToCart, onToggleHidden, onDelete }) {
  const { status } = product;

  if (isOwner) {
    const hideButton = (
      <button
        type="button"
        className="h-12 px-6 bg-white hover:bg-[#f9fafb] text-[#111827] border border-[#d1d5db] text-base font-bold flex items-center justify-center transition-colors"
        onClick={onToggleHidden}
        disabled={isBusy}
      >
        {product.hidden ? '숨김 해제' : '숨기기'}
      </button>
    );
    return (
      <>
        {OWNER_LOCKED.includes(status) ? (
          <div className="grid grid-cols-1 gap-3 mb-6">{hideButton}</div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Link to={`/products/${product.productId}/edit`} className={PRIMARY_BUTTON}>
              수정
            </Link>
            {hideButton}
            <button
              type="button"
              className="h-12 px-6 bg-white hover:bg-[#f9fafb] text-[#b91c1c] border border-[#d1d5db] text-base font-bold flex items-center justify-center transition-colors"
              onClick={onDelete}
              disabled={isBusy}
            >
              삭제
            </button>
          </div>
        )}
        <ActionErrorLine message={actionError} className="-mt-4 mb-6" />
        {REVIEW_STATUSES.includes(status) && (
          <Link
            to={`/products/${product.productId}/review`}
            className="-mt-3 mb-6 inline-flex text-sm font-semibold text-[#0f4c3a] hover:underline"
          >
            검수 결과 보기 →
          </Link>
        )}
      </>
    );
  }

  if (status !== 'ACTIVE') {
    return (
      <>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <button
            type="button"
            disabled
            className="h-12 px-6 bg-[#e5e7eb] text-[#9ca3af] text-base font-bold flex items-center justify-center cursor-not-allowed"
          >
            바로 구매
          </button>
          <button
            type="button"
            disabled
            className="h-12 px-6 bg-[#e5e7eb] text-[#9ca3af] text-base font-bold flex items-center justify-center cursor-not-allowed gap-2"
          >
            <CartIcon />
            <span>장바구니 담기</span>
          </button>
        </div>
        <p className="text-sm text-[#4b5563] mb-6">{BLOCKED_TEXT[status] ?? '지금은 구매할 수 없는 상품이에요.'}</p>
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button type="button" className={PRIMARY_BUTTON} onClick={onBuy} disabled={isBusy}>
          바로 구매
        </button>
        <button type="button" className={SECONDARY_BUTTON} onClick={onAddToCart} disabled={isBusy}>
          <CartIcon />
          <span>장바구니 담기</span>
        </button>
      </div>
      <ActionErrorLine message={actionError} className="-mt-4 mb-6" />
    </>
  );
}

// 안내 박스 문구: [제목, 설명]
function getNotice(product, isOwner) {
  if (!isOwner) return ['예치금으로 결제하고, 구매 확정 후 판매자에게 정산돼요', '배송 완료 3일 뒤에는 자동으로 구매 확정돼요.'];
  if (product.status === 'REVIEW_PENDING') {
    return ['검수 중인 상품이라 다른 회원에게 보이지 않아요', '검수를 통과하면 바로 판매를 시작해요. 결과는 알림으로도 알려 드려요.'];
  }
  if (product.status === 'REJECTED') {
    return ['검수에서 반려된 상품이라 다른 회원에게 보이지 않아요', '검수 결과에서 사유를 확인하고 상품을 고쳐 다시 검수받을 수 있어요.'];
  }
  if (OWNER_LOCKED.includes(product.status)) {
    return [
      '내가 올린 상품이에요',
      '거래 중이거나 판매 완료된 상품은 수정하거나 삭제할 수 없어요. 숨기면 다른 회원에게 보이지 않아요.',
    ];
  }
  if (product.hidden) {
    return [
      '숨긴 상품이라 다른 회원에게 보이지 않아요',
      '판매자가 거절하거나 반품으로 돌아온 상품은 자동으로 숨겨져요. 상태를 확인하고 숨김을 풀면 바로 판매돼요.',
    ];
  }
  return ['내가 올린 상품이에요', '내 상품은 구매하거나 장바구니에 담을 수 없어요. 숨기면 다른 회원에게 보이지 않아요.'];
}

function ProductDetailView({
  product,
  isOwner,
  selected,
  onSelectImage,
  onBack,
  isBusy,
  actionError,
  onBuy,
  onAddToCart,
  onToggleHidden,
  onDelete,
}) {
  const images = product.imageUrls ?? [];
  const badge = STATUS_BADGE[product.status];
  const [noticeTitle, noticeText] = getNotice(product, isOwner);
  const isSoldOut = product.status === 'SOLD_OUT';
  const descriptionLines = (product.description ?? '').split('\n').filter((line) => line.trim() !== '');

  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 py-6">
      <div className="mb-6">
        <a
          href="/"
          className="inline-flex items-center text-sm text-[#4b5563] hover:text-[#0f4c3a] font-normal transition-colors"
          onClick={(event) => {
            event.preventDefault();
            onBack();
          }}
        >
          ← 목록으로
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-start">
        <Gallery product={product} images={images} selected={selected} onSelectImage={onSelectImage} />

        <div className="lg:col-span-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            {product.species?.name && (
              <span className="inline-flex items-center px-2.5 py-0.5 bg-white border border-[#d1d5db] text-xs text-[#111827] font-normal">
                {product.species.name}
              </span>
            )}
            {badge && <span className={badge.className}>{badge.label}</span>}
            {isOwner && product.hidden && (
              <span className="inline-flex items-center px-2.5 py-0.5 bg-white border border-[#9ca3af] text-[#4b5563] text-xs font-bold">
                숨김
              </span>
            )}
          </div>

          <h1 className="text-[28px] leading-[1.3] font-bold text-[#111827] mb-3">{product.title}</h1>

          <div
            className={
              isSoldOut
                ? 'text-[32px] leading-none font-extrabold text-[#9ca3af] line-through mb-6'
                : 'text-[32px] leading-none font-extrabold text-[#111827] mb-6'
            }
          >
            {formatPrice(product.price)}
          </div>

          <div className="border-t border-b border-[#e5e7eb] py-4 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f4f8f6] border border-[#e5e7eb] flex items-center justify-center text-[#0f4c3a] font-bold text-base flex-shrink-0">
                {product.sellerName?.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6b7280]">판매자</span>
                <span className="text-base font-semibold text-[#111827]">{product.sellerName}</span>
              </div>
            </div>
            {/* 판매자 상점 B안 (02-3-1). 상점의 「< 상품 상세」가 이 상품으로 돌아오도록 상품 번호를 넘김 */}
            <Link
              to={`/sellers/${product.sellerId}`}
              state={{ fromProductId: product.productId }}
              className="text-sm font-medium text-[#0f4c3a] hover:underline flex items-center"
            >
              상점 보기 ›
            </Link>
          </div>

          <div className="space-y-3 text-sm mb-8">
            <div className="flex items-start">
              <span className="w-[88px] text-[#4b5563] flex-shrink-0">거래 방식</span>
              <span className="text-[#111827] font-medium">택배 거래 · 판매자가 수락하면 택배가 자동 접수돼요</span>
            </div>
            <div className="flex items-start">
              <span className="w-[88px] text-[#4b5563] flex-shrink-0">등록일</span>
              <span className="text-[#111827]">{formatKoreanDate(product.createdAt)}</span>
            </div>
          </div>

          <Actions
            product={product}
            isOwner={isOwner}
            isBusy={isBusy}
            actionError={actionError}
            onBuy={onBuy}
            onAddToCart={onAddToCart}
            onToggleHidden={onToggleHidden}
            onDelete={onDelete}
          />

          <div className="bg-[#f4f8f6] border border-[#e5e7eb] px-5 py-4 flex items-start gap-3.5">
            <div className="mt-0.5 flex-shrink-0 text-[#0f4c3a]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-bold text-[#111827] leading-snug">{noticeTitle}</span>
              <span className="text-[13px] text-[#4b5563] leading-normal">{noticeText}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#e5e7eb] mt-12 pt-8 mb-16">
        <h2 className="text-xl font-bold text-[#111827] mb-6">상품 설명</h2>
        <div className="max-w-[760px] text-[15px] text-[#374151] leading-[1.8] space-y-1">
          {descriptionLines.map((line, index) => (
            // 같은 문장이 두 번 나올 수 있어 순서를 key에 섞음
            <p key={`${index}-${line}`}>{line}</p>
          ))}
        </div>
      </div>
    </main>
  );
}

export default ProductDetailView;

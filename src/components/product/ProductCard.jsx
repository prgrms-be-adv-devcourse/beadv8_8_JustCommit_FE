import { Link } from 'react-router-dom';
import { formatPrice, formatRelativeTime } from '../../utils/format';
import ProductThumbnail from './ProductThumbnail';

// 상품 목록 카드 (시안 02-1-1 메인)
// 거래 중(PAYMENT_PENDING): 어둡게 + RESERVED / 판매 완료(SOLD_OUT): 흑백 + 더 어둡게 + SOLD OUT + 가격 취소선
const OVERLAY = {
  PAYMENT_PENDING: {
    dim: 'rgba(0, 0, 0, 0.3)',
    label: 'RESERVED',
    badgeClass:
      'inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold tracking-wider text-white backdrop-blur-md shadow-sm rounded-none select-none font-bold border-0',
    badgeStyle: { backgroundColor: 'rgb(15, 76, 58)', border: '2px solid rgb(255, 255, 255)' },
  },
  SOLD_OUT: {
    dim: 'rgba(0, 0, 0, 0.6)',
    label: 'SOLD OUT',
    badgeClass:
      'inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold tracking-wider text-white bg-[#000000] backdrop-blur-md shadow-sm rounded-none select-none font-bold border-0',
    badgeStyle: { border: '2px solid rgb(255, 255, 255)' },
  },
};

// tabularPrice: 가격에 tabular-nums (시안 02-3-1 판매자 상점 카드는 있고, 02-1-1 메인 카드는 없음)
function ProductCard({ product, tabularPrice = false }) {
  const isSoldOut = product.status === 'SOLD_OUT';
  const overlay = OVERLAY[product.status];

  return (
    <Link to={`/products/${product.productId}`} className="group flex flex-col cursor-pointer" data-purpose="product-card">
      <div className="relative aspect-square w-full rounded-2xl bg-[#f0f5f1] overflow-hidden flex items-center justify-center transition-all duration-200 group-hover:opacity-95">
        {isSoldOut ? (
          <ProductThumbnail
            src={product.thumbnailUrl}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover rounded-xl grayscale transition-all duration-200 group-hover:scale-105"
            style={{ filter: 'grayscale(100%)' }}
          />
        ) : (
          <ProductThumbnail
            src={product.thumbnailUrl}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-105"
          />
        )}
        {overlay && (
          <>
            <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundColor: overlay.dim }} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <span className={overlay.badgeClass} style={overlay.badgeStyle}>
                {overlay.label}
              </span>
            </div>
          </>
        )}
      </div>
      <div className="pt-3">
        <h3 className="text-[15px] text-gray-800 line-clamp-1 group-hover:text-replant-forest transition-colors">
          {product.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span
            className={`text-[18px] font-bold text-[#191919]${isSoldOut ? ' line-through' : ''}${tabularPrice ? ' tabular-nums' : ''}`}
          >
            {formatPrice(product.price)}
          </span>
          <span className="text-xs text-gray-400">{formatRelativeTime(product.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;

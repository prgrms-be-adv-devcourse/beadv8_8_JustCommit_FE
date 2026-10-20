import { Link } from 'react-router-dom';
import {
  PRODUCT_STATUS,
  SPECIES_DIFFICULTY,
  SPECIES_LIGHT,
  SPECIES_WATERING,
} from '../../constants/product';
import { formatPrice, formatRelativeTime } from '../../utils/format';
import ProductThumbnail from './ProductThumbnail';
import styles from './ProductCard.module.css';

// isMine: 로그인한 판매자 본인 상품이면 상태 배지 옆에 '내 상품' 표시
function ProductCard({ product, isMine = false }) {
  const status = PRODUCT_STATUS[product.status] ?? { label: product.status, tone: 'pending' };
  const isSoldOut = product.status === 'SOLD_OUT';
  // 관리 태그: 품종에 값이 없는 항목은 빼고 표시
  const careTags = [
    { icon: 'light_mode', label: SPECIES_LIGHT[product.light] },
    { icon: 'water_drop', label: SPECIES_WATERING[product.watering] },
    { icon: 'signal_cellular_alt', label: SPECIES_DIFFICULTY[product.difficulty] },
  ].filter((tag) => tag.label);

  return (
    <Link
      to={`/products/${product.productId}`}
      className={`${styles.card} ${isSoldOut ? styles.soldOutCard : ''}`}
    >
      <div className={styles.thumb}>
        <ProductThumbnail
          src={product.thumbnailUrl}
          alt={`${product.title} 사진`}
          loading="lazy"
        />
        <span className={styles.badges}>
          <span className={`${styles.badge} ${styles[status.tone]}`}>{status.label}</span>
          {isMine && <span className={`${styles.badge} ${styles.mine}`}>내 상품</span>}
        </span>
      </div>

      <div className={styles.body}>
        <span className={styles.title}>{product.title}</span>
        <span className={styles.price}>{formatPrice(product.price)}</span>
        <span className={styles.meta}>
          {product.speciesName} · {formatRelativeTime(product.createdAt)}
        </span>
        {careTags.length > 0 && (
          <span className={styles.careTags}>
            {careTags.map((tag) => (
              <span key={tag.icon} className={styles.careTag}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  {tag.icon}
                </span>
                {tag.label}
              </span>
            ))}
          </span>
        )}
      </div>
    </Link>
  );
}

export default ProductCard;

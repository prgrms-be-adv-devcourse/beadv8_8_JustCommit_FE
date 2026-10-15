import { Link } from 'react-router-dom';
import { PRODUCT_STATUS } from '../../constants/product';
import { formatPrice, formatRelativeTime } from '../../utils/format';
import styles from './ProductCard.module.css';

const PLACEHOLDER_ICONS = ['potted_plant', 'eco', 'spa', 'psychiatry'];

function ProductCard({ product }) {
  const status = PRODUCT_STATUS[product.status] ?? { label: product.status, tone: 'pending' };
  const isSoldOut = product.status === 'SOLD_OUT';
  const placeholderIcon = PLACEHOLDER_ICONS[product.productId % PLACEHOLDER_ICONS.length];

  return (
    <Link
      to={`/products/${product.productId}`}
      className={`${styles.card} ${isSoldOut ? styles.soldOutCard : ''}`}
    >
      <div className={styles.thumb}>
        {product.thumbnailUrl ? (
          <img src={product.thumbnailUrl} alt={`${product.title} 사진`} loading="lazy" />
        ) : (
          <span className="material-symbols-outlined" aria-hidden="true">
            {placeholderIcon}
          </span>
        )}
        <span className={`${styles.badge} ${styles[status.tone]}`}>{status.label}</span>
      </div>

      <div className={styles.body}>
        <span className={styles.title}>{product.title}</span>
        <span className={styles.price}>{formatPrice(product.price)}</span>
        <span className={styles.meta}>
          {product.speciesName} · {formatRelativeTime(product.createdAt)}
        </span>
      </div>
    </Link>
  );
}

export default ProductCard;

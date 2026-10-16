import { useState } from 'react';
import styles from './ProductThumbnail.module.css';

// 대체 썸네일 공통 새싹 아이콘 (시안 SVG)
function SproutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 21V10" />
      <path d="M12 12c0-3-2-6-7-6 0 4 3 6 7 6Z" />
      <path d="M12 10c0-3 2-6 7-6 0 4-3 6-7 6Z" />
    </svg>
  );
}

// 상품 사진: 주소가 없거나 로딩에 실패하면 새싹 아이콘으로 대체
// size="large"(상품 카드·상세 큰 사진): 아이콘 + 안내 문구 / size="small"(장바구니·작은 썸네일): 아이콘만
function ProductThumbnail({ src, alt, size = 'large', ...imgProps }) {
  // 실패한 "주소"를 기억 → 다른 사진으로 바뀌면(상세 페이지 사진 넘기기) 자동으로 다시 시도
  const [failedSrc, setFailedSrc] = useState(null);
  const isFailed = Boolean(src) && failedSrc === src;

  if (!src || isFailed) {
    return (
      <span className={`${styles.fallback} ${styles[size]}`}>
        <SproutIcon />
        {size === 'large' && (
          <span className={styles.text}>{isFailed ? '이미지를 불러오지 못했어요' : '이미지 없음'}</span>
        )}
      </span>
    );
  }

  return <img src={src} alt={alt} onError={() => setFailedSrc(src)} {...imgProps} />;
}

export default ProductThumbnail;

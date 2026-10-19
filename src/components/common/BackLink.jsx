import { Link } from 'react-router-dom';
import styles from './BackLink.module.css';

// 화면 위쪽 "← 이전 화면" 링크 (예치금·주문 내역 → 마이페이지 등)
function BackLink({ to, label }) {
  return (
    <Link to={to} className={styles.backLink}>
      <span className="material-symbols-outlined" aria-hidden="true">
        arrow_back
      </span>
      {label}
    </Link>
  );
}

export default BackLink;

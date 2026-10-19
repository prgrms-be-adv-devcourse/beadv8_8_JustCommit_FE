import { SALES_STATUS } from '../../constants/order';
import styles from './SalesStatusBadge.module.css';

// 판매 주문 배송 상태 배지 (시안 11-F)
function SalesStatusBadge({ status }) {
  const { label, tone } = SALES_STATUS[status] ?? SALES_STATUS.PREPARING;
  return <span className={`${styles.badge} ${styles[tone]}`}>{label}</span>;
}

export default SalesStatusBadge;

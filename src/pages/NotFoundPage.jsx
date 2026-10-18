import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import styles from './NotFoundPage.module.css';

function NotFoundPage() {
  usePageTitle('페이지를 찾을 수 없음');
  return (
    <section className={styles.page} aria-labelledby="not-found-title">
      <span className={`material-symbols-outlined ${styles.icon}`} aria-hidden="true">
        search_off
      </span>
      <h1 id="not-found-title" className={styles.title}>
        페이지를 찾을 수 없어요
      </h1>
      <Link to="/" className={styles.homeButton}>
        홈으로
      </Link>
    </section>
  );
}

export default NotFoundPage;

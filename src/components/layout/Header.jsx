import { Link } from 'react-router-dom';
import styles from './Header.module.css';

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          replant
        </Link>

        <nav className={styles.nav}>
          <Link to="/login" className={styles.navLink}>
            로그인
          </Link>
          <Link to="/signup" className={styles.primaryButton}>
            회원가입
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;

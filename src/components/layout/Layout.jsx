import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import styles from './Layout.module.css';

// 이 경로로 시작하는 페이지는 푸터를 숨김
const HIDE_FOOTER_PREFIXES = ['/mypage', '/wallet', '/deposit'];

function Layout() {
  const { pathname } = useLocation();
  const hideFooter = HIDE_FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <Outlet />
        </div>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default Layout;

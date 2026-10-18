import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import styles from './Layout.module.css';

// 이 경로로 시작하는 페이지는 푸터를 숨김
const HIDE_FOOTER_PREFIXES = ['/mypage', '/wallet', '/deposit'];

// hideFooter: 경로와 상관없이 푸터를 숨길 때 (404처럼 아무 주소나 해당되는 화면)
function Layout({ hideFooter: forceHideFooter = false }) {
  const { pathname } = useLocation();
  const hideFooter =
    forceHideFooter || HIDE_FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix));

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

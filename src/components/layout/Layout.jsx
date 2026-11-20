import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatbotWidget from '../ai/ChatbotWidget';
import styles from './Layout.module.css';

// 이 경로로 시작하는 페이지는 푸터를 숨김 (시안 이전 화면용)
const HIDE_FOOTER_PREFIXES = ['/mypage', '/wallet', '/deposit'];

// designed: 새 시안으로 다시 만든 화면.
//   시안의 <body class="bg-white text-[#111827] min-h-screen flex flex-col">처럼 헤더 · 화면 · 푸터만 쌓고,
//   화면이 직접 <main class="flex-1 max-w-[1240px] ...">을 그립니다. 시안 화면은 모두 푸터가 있어요.
// hideFooter: 시안 이전 화면에서 경로와 상관없이 푸터를 숨길 때 (404처럼 아무 주소나 해당되는 화면)
function Layout({ designed = false, hideFooter: forceHideFooter = false }) {
  const { pathname } = useLocation();

  if (designed) {
    return (
      <div className="bg-white text-[#111827] min-h-screen flex flex-col antialiased">
        <Header />
        <Outlet />
        <Footer />
        {/* 식물 상담 챗봇 (오른쪽 아래 버튼) */}
        <ChatbotWidget />
      </div>
    );
  }

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

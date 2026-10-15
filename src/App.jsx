import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ComingSoonPage from './pages/ComingSoonPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/member/LoginPage';
import SignupPage from './pages/member/SignupPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Header·Footer 없는 페이지 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Header·Footer 있는 페이지 */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/terms" element={<ComingSoonPage title="이용약관" />} />
          <Route path="/privacy" element={<ComingSoonPage title="개인정보처리방침" />} />
          <Route path="/safety-policy" element={<ComingSoonPage title="안전 보증 정책" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

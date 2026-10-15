import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

function NotFoundPage() {
  usePageTitle('페이지를 찾을 수 없음');
  return (
    <div>
      <h1>페이지를 찾을 수 없습니다</h1>
      <Link to="/">홈으로</Link>
    </div>
  );
}

export default NotFoundPage;

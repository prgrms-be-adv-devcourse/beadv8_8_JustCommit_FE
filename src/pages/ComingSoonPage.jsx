import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

function ComingSoonPage({ title }) {
  usePageTitle(title);

  return (
    <div>
      <h1>{title}</h1>
      <p>현재 준비 중인 페이지입니다.</p>
      <Link to="/">홈으로</Link>
    </div>
  );
}

export default ComingSoonPage;

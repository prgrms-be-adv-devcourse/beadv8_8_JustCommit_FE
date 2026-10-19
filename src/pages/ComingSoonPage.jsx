import { Link } from 'react-router-dom';
import BackLink from '../components/common/BackLink';
import usePageTitle from '../hooks/usePageTitle';

// backTo를 주면 위쪽에 "← 돌아가기" 링크 표시 (마이페이지 메뉴에서 들어온 준비 중 화면 등)
function ComingSoonPage({ title, backTo, backLabel = '마이페이지' }) {
  usePageTitle(title);

  return (
    <div>
      {backTo && <BackLink to={backTo} label={backLabel} />}
      <h1>{title}</h1>
      <p>현재 준비 중인 페이지입니다.</p>
      <Link to="/">홈으로</Link>
    </div>
  );
}

export default ComingSoonPage;

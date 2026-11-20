import { useEffect, useState } from 'react';
import { getManualImageReviews } from '../../api/adminApi';
import usePageTitle from '../../hooks/usePageTitle';
import ErrorPage from '../../components/common/ErrorPage';
import AdminReviewsView from './AdminReviewsView';
import { toReviewList } from './imageReviewModel';

// 09-2-1 사진 검수 목록 (/admin/reviews)
function AdminReviewsPage() {
  usePageTitle('사진 검수');
  const [data, setData] = useState(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let ignore = false;
    getManualImageReviews()
      .then((response) => {
        if (!ignore) setData(toReviewList(response.data.data));
      })
      .catch((error) => {
        // 403 말고 실패하면 자리 문구 화면을 그대로 둠
        if (!ignore && error.response?.status === 403) setForbidden(true);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (forbidden) return <ErrorPage type="FORBIDDEN" />;
  return <AdminReviewsView data={data} />;
}

export default AdminReviewsPage;

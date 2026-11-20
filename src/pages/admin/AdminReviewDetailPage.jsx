import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { decideImageReview, getManualImageReviews } from '../../api/adminApi';
import usePageTitle from '../../hooks/usePageTitle';
import ErrorPage from '../../components/common/ErrorPage';
import { ACTION_ERROR } from '../../constants/actionError';
import AdminReviewDetailView from './AdminReviewDetailView';
import AdminReviewRejectModal from './AdminReviewRejectModal';
import { toReviewDetail } from './imageReviewModel';

// 409: 다른 관리자가 먼저 처리했거나 그사이 판매자가 수정 · 삭제함 (docs/flows/image-review.md)
const CONFLICT_MESSAGE = '이미 처리됐거나 판매자가 상품을 바꿨어요. 목록에서 다시 확인해 주세요.';

function toErrorMessage(error) {
  const status = error.response?.status;
  if (status === 409) return CONFLICT_MESSAGE;
  if (status === 429) return ACTION_ERROR.TOO_MANY_REQUESTS;
  return ACTION_ERROR.DEFAULT;
}

// 09-2-2 사진 검수 상세 + 09-2-3 반려 사유 선택 (/admin/reviews/:imageReviewId)
function AdminReviewDetailPage() {
  usePageTitle('사진 검수');
  const { imageReviewId } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loadStatus, setLoadStatus] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    // 한 건 상세 API가 없어 대기 목록에서 찾음. 없으면 이미 처리됐거나 판매자가 수정 · 삭제한 건
    getManualImageReviews()
      .then((response) => {
        if (ignore) return;
        const found = response.data.data.content.find((item) => String(item.reviewId) === imageReviewId);
        if (found) setReview(toReviewDetail(found));
        else setLoadStatus(404);
      })
      .catch((loadError) => {
        if (!ignore) setLoadStatus(loadError.response?.status ?? null);
      });
    return () => {
      ignore = true;
    };
  }, [imageReviewId]);

  const decide = async (body) => {
    setBusy(true);
    setError(null);
    try {
      await decideImageReview(imageReviewId, body);
      navigate('/admin/reviews', { replace: true });
    } catch (decideError) {
      setError(toErrorMessage(decideError));
    } finally {
      setBusy(false);
    }
  };

  if (loadStatus === 403) return <ErrorPage type="FORBIDDEN" />;
  // 대기 목록에 없음(이미 처리됨 등) → 목록으로
  if (loadStatus === 404) return <Navigate to="/admin/reviews" replace />;

  return (
    <>
      <AdminReviewDetailView
        review={review}
        busy={busy}
        error={rejectOpen ? null : error}
        onApprove={() => decide({ decision: 'APPROVED' })}
        onReject={() => {
          setError(null);
          setRejectOpen(true);
        }}
      />
      {rejectOpen && (
        <AdminReviewRejectModal
          initialCode={review?.autoRejectReason ?? null}
          busy={busy}
          error={error}
          onClose={() => {
            setError(null);
            setRejectOpen(false);
          }}
          onSubmit={({ reasonCode, reasonText }) =>
            decide({ decision: 'REJECTED', rejectReason: reasonCode, memo: reasonText })
          }
        />
      )}
    </>
  );
}

export default AdminReviewDetailPage;

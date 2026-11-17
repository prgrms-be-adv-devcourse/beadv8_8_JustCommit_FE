import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { decideImageReview, getImageReview } from '../../api/adminApi';
import usePageTitle from '../../hooks/usePageTitle';
import ErrorPage from '../../components/common/ErrorPage';
import { ACTION_ERROR } from '../../constants/actionError';
import AdminReviewDetailView from './AdminReviewDetailView';
import AdminReviewRejectModal from './AdminReviewRejectModal';

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
    getImageReview(imageReviewId)
      .then((response) => {
        if (!ignore) setReview(response.data.data);
      })
      .catch((loadError) => {
        // TODO: BE 상세 API가 생기기 전에는 실패하므로 자리 문구 화면을 그대로 둠
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

  return (
    <>
      <AdminReviewDetailView
        review={review}
        busy={busy}
        error={rejectOpen ? null : error}
        onApprove={() => decide({ result: 'APPROVED' })}
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
            decide({ result: 'REJECTED', reasonCode, reasonText })
          }
        />
      )}
    </>
  );
}

export default AdminReviewDetailPage;

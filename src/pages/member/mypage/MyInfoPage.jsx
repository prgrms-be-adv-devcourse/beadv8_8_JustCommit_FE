import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import usePageTitle from '../../../hooks/usePageTitle';
import { getMyInfo } from '../../../api/memberApi';
import { BANKS } from '../../../constants/banks';
import { formatPhone } from '../../../utils/format';
import layout from './SubPageLayout.module.css';
import styles from './MyPageSection.module.css';

const PROVIDER_LABEL = { LOCAL: '이메일 가입', KAKAO: '카카오 가입' };

function MyInfoPage() {
  usePageTitle('내 정보');
  const { isLoggedIn, isInitializing } = useAuth();
  const [myInfo, setMyInfo] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;

    getMyInfo()
      .then((response) => {
        if (!ignore) setMyInfo(response.data.data);
      })
      .catch((error) => {
        if (!ignore) setLoadError(error.response?.data?.message ?? '내 정보를 불러오지 못했습니다.');
      });

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const bankName = BANKS.find((bank) => bank.code === myInfo?.account?.bankCode)?.name;

  return (
    <div className={layout.page}>
      <Link to="/mypage" className={layout.backLink}>
        <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        마이페이지
      </Link>
      <h1 className={layout.title}>내 정보</h1>

      {loadError && <p className={styles.status} role="alert">{loadError}</p>}
      {!loadError && !myInfo && <p className={styles.status}>내 정보를 불러오는 중...</p>}

      {myInfo && (
        <>
          <section className={styles.card} aria-labelledby="info-title">
            <div className={styles.sectionHeader}>
              <h2 id="info-title" className={styles.sectionTitle}>
                <span className="material-symbols-outlined">person</span>
                기본 정보
              </h2>
            </div>
            <dl className={styles.infoList}>
              <dt>이메일</dt>
              <dd>{myInfo.email}</dd>
              <dt>닉네임</dt>
              <dd>{myInfo.nickname}</dd>
              <dt>휴대폰 번호</dt>
              <dd>{formatPhone(myInfo.phone)}</dd>
              <dt>가입 방식</dt>
              <dd>{PROVIDER_LABEL[myInfo.provider] ?? myInfo.provider}</dd>
            </dl>
          </section>

          <section className={styles.card} aria-labelledby="account-title">
            <div className={styles.sectionHeader}>
              <h2 id="account-title" className={styles.sectionTitle}>
                <span className="material-symbols-outlined">account_balance</span>
                정산·환급 계좌
              </h2>
            </div>
            {myInfo.account ? (
              <dl className={styles.infoList}>
                <dt>은행</dt>
                <dd>{bankName ?? myInfo.account.bankCode}</dd>
                <dt>계좌번호</dt>
                <dd>{myInfo.account.maskedAccountNo}</dd>
                <dt>예금주</dt>
                <dd>{myInfo.account.accountHolder}</dd>
              </dl>
            ) : (
              <p className={styles.empty}>등록된 계좌가 없습니다.</p>
            )}
            <p className={styles.notice}>예치금 환불과 판매 대금 정산에 사용되는 계좌입니다.</p>
          </section>
        </>
      )}
    </div>
  );
}

export default MyInfoPage;

import { useEffect, useState } from 'react';
import { getMyInfo } from '../../../api/memberApi';
import useAuth from '../../../hooks/useAuth';

// 회원 정보 수정 화면들이 같이 쓰는 내 정보 조회
// → { myInfo(null = 로딩 중), loadError, reload }
function useMyInfo() {
  const { isLoggedIn } = useAuth();
  const [myInfo, setMyInfo] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [version, setVersion] = useState(0);

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
  }, [isLoggedIn, version]);

  return { myInfo, loadError, reload: () => setVersion((v) => v + 1) };
}

export default useMyInfo;

import { useCallback, useEffect, useMemo, useState } from 'react';
import { reissueAccessToken } from '../api/client';
import {
  getMyInfo,
  login as loginApi,
  logout as logoutApi,
  signup as signupApi,
} from '../api/memberApi';
import { clearAccessToken, setAccessToken } from '../api/tokenStore';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // 로그인 안 했으면 null, 했으면 { memberId, nickname, role }
  const [isInitializing, setIsInitializing] = useState(true);

  // 앱이 켜질 때 한 번: Refresh 쿠키로 로그인 상태 복구
  useEffect(() => {
    let ignore = false;

    async function restoreLogin() {
      try {
        await reissueAccessToken();
        const response = await getMyInfo();
        const { memberId, nickname, role } = response.data.data;
        if (!ignore) {
          setUser({ memberId, nickname, role });
        }
      } catch {
        // Refresh 쿠키가 없거나 만료됨 → 로그인 안 된 상태로 시작
        clearAccessToken();
      } finally {
        if (!ignore) {
          setIsInitializing(false);
        }
      }
    }

    restoreLogin();

    return () => {
      ignore = true;
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const response = await loginApi({ email, password });
    setAccessToken(response.data.data.accessToken);
    // 로그인 응답에는 회원 ID가 없어서 내 정보를 한 번 더 조회 (내 상품 판단 등에 사용)
    const me = await getMyInfo();
    const { memberId, nickname, role } = me.data.data;
    setUser({ memberId, nickname, role });
  }, []);

  // 로컬 회원가입: 응답에 토큰이 없으므로 로그인 상태는 바꾸지 않음 (가입 후 login 호출 필요)
  const signup = useCallback(async (form) => {
    await signupApi(form);
  }, []);

  // 토큰 재발급 + 내 정보 다시 조회 (판매자 등록 후 role 갱신용)
  const refreshUser = useCallback(async () => {
    await reissueAccessToken();
    const response = await getMyInfo();
    const { memberId, nickname, role } = response.data.data;
    setUser({ memberId, nickname, role });
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: user !== null,
      isInitializing,
      login,
      signup,
      refreshUser,
      logout,
    }),
    [user, isInitializing, login, signup, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { reissueAccessToken } from '../api/client';
import { getMyInfo, login as loginApi, logout as logoutApi } from '../api/memberApi';
import { clearAccessToken, setAccessToken } from '../api/tokenStore';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // 로그인 안 했으면 null, 했으면 { nickname, role }
  const [isInitializing, setIsInitializing] = useState(true);

  // 앱이 켜질 때 한 번: Refresh 쿠키로 로그인 상태 복구
  useEffect(() => {
    let ignore = false;

    async function restoreLogin() {
      try {
        await reissueAccessToken();
        const response = await getMyInfo();
        const { nickname, role } = response.data.data;
        if (!ignore) {
          setUser({ nickname, role });
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
    const { accessToken, nickname, role } = response.data.data;
    setAccessToken(accessToken);
    setUser({ nickname, role });
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
      logout,
    }),
    [user, isInitializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

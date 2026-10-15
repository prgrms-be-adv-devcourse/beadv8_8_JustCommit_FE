import axios from 'axios';
import { clearAccessToken, getAccessToken, setAccessToken } from './tokenStore';

const REISSUE_URL = '/api/v1/auth/reissue';

// 401이 나도 재발급을 시도하지 않을 요청
const NO_RETRY_URLS = ['/api/v1/auth/login', REISSUE_URL, '/api/v1/auth/logout', '/api/v1/users/social'];

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

// 요청 인터셉터: Access 토큰 첨부
client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 재발급 요청을 하나로 묶기 위한 변수
let reissuePromise = null;

export function reissueAccessToken() {
  if (!reissuePromise) {
    reissuePromise = client
      .post(REISSUE_URL)
      .then((response) => {
        const token = response.data.data.accessToken;
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        reissuePromise = null;
      });
  }
  return reissuePromise;
}

// 응답 인터셉터: 401이면 재발급 후 원래 요청 재시도
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    const shouldSkip =
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      NO_RETRY_URLS.includes(originalRequest.url);

    if (shouldSkip) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const token = await reissueAccessToken();
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return client(originalRequest);
    } catch (reissueError) {
      clearAccessToken();
      return Promise.reject(reissueError);
    }
  },
);

export default client;

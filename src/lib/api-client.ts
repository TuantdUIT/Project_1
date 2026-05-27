import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { tokenStorage } from '@/lib/auth/token-storage';
import { parseApiError } from '@/utils/api-errors';

type FailedRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

type FormatRestResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
  error: unknown;
};

function isFormatRestResponse<T>(payload: unknown): payload is FormatRestResponse<T> {
  return (
    typeof payload === 'object'
    && payload !== null
    && 'statusCode' in payload
    && 'data' in payload
  );
}

const axiosInstance = axios.create({
  baseURL: env.VITE_APP_API_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    if (isFormatRestResponse(response.data)) {
      return response.data.data;
    }

    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as FailedRequestConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401
      && originalRequest
      && !originalRequest._retry
      && !originalRequest.url?.includes('/api/v1/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axiosInstance.get<
          unknown,
          { access_token?: string; accessToken?: string }
        >('/api/v1/auth/refresh');
        const accessToken = refreshResponse.access_token ?? refreshResponse.accessToken;

        if (!accessToken) {
          tokenStorage.clear();
          return Promise.reject(error);
        }

        tokenStorage.setAccessToken(accessToken);

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${accessToken}`,
        };

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        tokenStorage.clear();
        return Promise.reject(refreshError);
      }
    }

    if (status && status >= 400) {
      const parsedError = parseApiError(error);

      // Tạm tắt toast lỗi global (ApiErrorToast trong src/app/provider.tsx).
      // Bỏ comment khối dưới để khôi phục.
      // window.dispatchEvent(
      //   new CustomEvent('api:error', {
      //     detail: parsedError,
      //   }),
      // );

      console.error(parsedError.message);
    }

    return Promise.reject(error);
  },
);

/**
 * Ý nghĩa: Gửi request GET và trả về trực tiếp phần data đã được unwrap từ Axios response.
 * Hàm sử dụng hàm này làm đầu vào: auth-api.getAccount dùng để lấy hồ sơ user; các feature P1/P2 sẽ dùng để đọc dữ liệu backend.
 */
function get<T>(url: string, config?: AxiosRequestConfig) {
  return axiosInstance.get<unknown, T>(url, config);
}

/**
 * Ý nghĩa: Gửi request POST và trả về trực tiếp phần data đã được unwrap từ Axios response.
 * Hàm sử dụng hàm này làm đầu vào: auth-api.login/logout dùng để gửi thông tin auth lên backend.
 */
function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return axiosInstance.post<unknown, T>(url, data, config);
}

/**
 * Ý nghĩa: Gửi request PUT và trả về trực tiếp phần data đã được unwrap từ Axios response.
 * Hàm sử dụng hàm này làm đầu vào: các feature P1/P2 dùng để cập nhật tài nguyên backend khi cần.
 */
function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return axiosInstance.put<unknown, T>(url, data, config);
}

/**
 * Ý nghĩa: Gửi request DELETE và trả về trực tiếp phần data đã được unwrap từ Axios response.
 * Hàm sử dụng hàm này làm đầu vào: các feature P1/P2 dùng để xóa tài nguyên backend khi cần.
 */
function remove<T>(url: string, config?: AxiosRequestConfig) {
  return axiosInstance.delete<unknown, T>(url, config);
}

export const apiClient = {
  get,
  post,
  put,
  delete: remove,
};

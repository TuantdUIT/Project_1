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

const axiosInstanceES = axios.create({
  baseURL: env.VITE_APP_API_URL_ES,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

axiosInstanceES.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstanceES.interceptors.response.use(
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
        const refreshResponse = await axiosInstanceES.get<
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

        return axiosInstanceES(originalRequest);
      } catch (refreshError) {
        tokenStorage.clear();
        return Promise.reject(refreshError);
      }
    }

    if (status && status >= 400) {
      const parsedError = parseApiError(error);
      console.error(parsedError.message);
    }

    return Promise.reject(error);
  },
);

function get<T>(url: string, config?: AxiosRequestConfig) {
  return axiosInstanceES.get<unknown, T>(url, config);
}

function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return axiosInstanceES.post<unknown, T>(url, data, config);
}

function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return axiosInstanceES.put<unknown, T>(url, data, config);
}

function remove<T>(url: string, config?: AxiosRequestConfig) {
  return axiosInstanceES.delete<unknown, T>(url, config);
}

export const apiClientES = {
  get,
  post,
  put,
  delete: remove,
};

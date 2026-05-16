const ACCESS_TOKEN_KEY = 'auth.access';

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clear() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export const tokenStorage = {
  getAccessToken,
  setAccessToken,
  clear,
};

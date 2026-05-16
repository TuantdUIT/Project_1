import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi, type AuthRole, type AuthUser } from '@/lib/auth/auth-api';
import { tokenStorage } from '@/lib/auth/token-storage';

type AuthContextValue = {
  user: AuthUser | null;
  role: AuthRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AUTH_USER_KEY = 'auth.user';
const AUTH_ROLE_KEY = 'auth.role';

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredJson<T>(key: string): T | null {
  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function storeSession(user: AuthUser, role: AuthRole) {
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.localStorage.setItem(AUTH_ROLE_KEY, JSON.stringify(role));
}

function clearStoredSession() {
  tokenStorage.clear();
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.localStorage.removeItem(AUTH_ROLE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredJson<AuthUser>(AUTH_USER_KEY));
  const [role, setRole] = useState<AuthRole | null>(() => readStoredJson<AuthRole>(AUTH_ROLE_KEY));
  const [isLoading, setIsLoading] = useState(Boolean(tokenStorage.getAccessToken()));

  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken();

    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    authApi
      .getAccount()
      .then((account) => {
        if (!isMounted) {
          return;
        }

        setUser(account.user);
        setRole(account.role);
        storeSession(account.user, account.role);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        clearStoredSession();
        setUser(null);
        setRole(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const session = await authApi.login(email, password);

    if (!session.accessToken) {
      return false;
    }

    tokenStorage.setAccessToken(session.accessToken);
    setUser(session.user);
    setRole(session.role);
    storeSession(session.user, session.role);

    return true;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clearStoredSession();
      setUser(null);
      setRole(null);
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [isLoading, role, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}

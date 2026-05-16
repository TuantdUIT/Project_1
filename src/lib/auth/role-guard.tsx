import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { paths } from '@/config/paths';
import { useAuth } from '@/lib/auth/auth-context';
import type { AuthRoleName } from '@/lib/auth/auth-api';

type RoleGuardProps = {
  roleName: AuthRoleName;
  children?: ReactNode;
};

export function RoleGuard({ roleName, children }: RoleGuardProps) {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (role?.roleName !== roleName) {
    return <Navigate to={paths.home} replace />;
  }

  return children ?? <Outlet />;
}

import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { paths } from '@/config/paths';
import { useAuth } from '@/lib/auth/auth-context';
import type { AuthRoleName } from '@/lib/auth/auth-api';

type RoleGuardProps = {
  roleName: AuthRoleName | AuthRoleName[];
  redirectTo?: string;
  children?: ReactNode;
};

export function RoleGuard({ roleName, redirectTo, children }: RoleGuardProps) {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  const allowedRoles = Array.isArray(roleName) ? roleName : [roleName];

  if (!role || !allowedRoles.includes(role.roleName)) {
    return <Navigate to={redirectTo ?? paths.home} replace />;
  }

  return children ?? <Outlet />;
}

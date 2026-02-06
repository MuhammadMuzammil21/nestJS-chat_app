import type { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import type { UserRole } from '../types/auth';

export function withRole<P extends object>(
    Component: ComponentType<P>,
    allowedRoles: UserRole[],
    redirectTo: string = '/'
) {
    return function WithRoleComponent(props: P) {
        const { hasRole } = useRole();

        if (!hasRole(allowedRoles)) {
            return <Navigate to={redirectTo} replace />;
        }

        return <Component {...props} />;
    };
}

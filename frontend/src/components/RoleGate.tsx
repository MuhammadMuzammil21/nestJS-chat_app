import type { ReactNode } from 'react';
import { useRole } from '../hooks/useRole';
import type { UserRole } from '../types/auth';

interface RoleGateProps {
    allowedRoles: UserRole[];
    children: ReactNode;
    fallback?: ReactNode;
}

const RoleGate = ({ allowedRoles, children, fallback = null }: RoleGateProps) => {
    const { hasRole } = useRole();

    if (!hasRole(allowedRoles)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export default RoleGate;

import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

export const useRole = () => {
    const { user } = useAuth();

    const hasRole = (allowedRoles: UserRole[]): boolean => {
        if (!user) return false;
        return allowedRoles.includes(user.role as UserRole);
    };

    const isAdmin = user?.role === 'ADMIN';
    const isPremium = user?.role === 'PREMIUM' || user?.role === 'ADMIN';
    const isFree = user?.role === 'FREE';

    return {
        hasRole,
        isAdmin,
        isPremium,
        isFree,
        currentRole: user?.role as UserRole | undefined,
    };
};

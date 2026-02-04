export interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    role: 'FREE' | 'PREMIUM' | 'ADMIN';
    subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'PAST_DUE';
    statusMessage?: string;
    createdAt: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

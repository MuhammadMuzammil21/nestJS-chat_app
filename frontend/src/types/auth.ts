export interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    role: string;
    subscriptionStatus?: string;
}

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface AuthContextType extends AuthState {
    login: (tokens: TokenResponse) => void;
    logout: () => Promise<void>;
    refreshTokens: () => Promise<boolean>;
}

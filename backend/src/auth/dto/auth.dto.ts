import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class GoogleUserDto {
    @IsNotEmpty()
    @IsString()
    email: string;

    @IsNotEmpty()
    @IsString()
    displayName: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string | null;

    @IsNotEmpty()
    @IsString()
    googleId: string;
}

export class TokenResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        displayName: string;
        avatarUrl?: string | null;
        role: string;
    };
}

export class RefreshTokenDto {
    @IsNotEmpty()
    @IsString()
    refreshToken: string;
}

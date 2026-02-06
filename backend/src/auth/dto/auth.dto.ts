import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleUserDto {
    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    @IsNotEmpty()
    @IsString()
    email: string;

    @ApiProperty({ description: 'User display name', example: 'John Doe' })
    @IsNotEmpty()
    @IsString()
    displayName: string;

    @ApiPropertyOptional({ description: 'User avatar URL', example: 'https://example.com/avatar.jpg' })
    @IsOptional()
    @IsString()
    avatarUrl?: string | null;

    @ApiProperty({ description: 'Google user ID', example: 'google-123456' })
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
    @ApiProperty({ description: 'Refresh token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    @IsNotEmpty()
    @IsString()
    refreshToken: string;
}

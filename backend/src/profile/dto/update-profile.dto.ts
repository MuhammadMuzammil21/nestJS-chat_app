import { IsString, IsOptional, IsUrl, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
    @ApiPropertyOptional({
        description: 'User display name',
        example: 'John Doe',
        minLength: 2,
        maxLength: 50,
    })
    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Display name must be at least 2 characters long' })
    @MaxLength(50, { message: 'Display name must not exceed 50 characters' })
    displayName?: string;

    @ApiPropertyOptional({
        description: 'Avatar URL',
        example: 'https://example.com/avatar.jpg',
    })
    @IsOptional()
    @IsString()
    @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
    avatarUrl?: string;

    @ApiPropertyOptional({
        description: 'Status message',
        example: 'Hello, world!',
        maxLength: 200,
    })
    @IsOptional()
    @IsString()
    @MaxLength(200, { message: 'Status message must not exceed 200 characters' })
    statusMessage?: string;
}

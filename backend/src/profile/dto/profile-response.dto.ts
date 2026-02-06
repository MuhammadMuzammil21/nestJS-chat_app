import { ApiProperty } from '@nestjs/swagger';
import { User, UserRole, SubscriptionStatus } from '../../entities/user.entity';

export class ProfileResponseDto {
    @ApiProperty({ description: 'User ID', example: 'uuid-123' })
    id: string;

    @ApiProperty({ description: 'User email', example: 'user@example.com' })
    email: string;

    @ApiProperty({ description: 'Display name', example: 'John Doe' })
    displayName: string;

    @ApiProperty({ description: 'Avatar URL', example: 'https://example.com/avatar.jpg', nullable: true })
    avatarUrl: string | null;

    @ApiProperty({ description: 'Status message', example: 'Hello, world!', nullable: true })
    statusMessage: string | null;

    @ApiProperty({ description: 'User role', enum: UserRole, example: UserRole.FREE })
    role: UserRole;

    @ApiProperty({ description: 'Subscription status', enum: SubscriptionStatus, example: SubscriptionStatus.INACTIVE })
    subscriptionStatus: SubscriptionStatus;

    @ApiProperty({ description: 'Account creation date', example: '2024-01-01T00:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update date', example: '2024-01-01T00:00:00.000Z' })
    updatedAt: Date;

    constructor(user: User) {
        this.id = user.id;
        this.email = user.email;
        this.displayName = user.displayName;
        this.avatarUrl = user.avatarUrl;
        this.statusMessage = user.statusMessage;
        this.role = user.role;
        this.subscriptionStatus = user.subscriptionStatus;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }
}

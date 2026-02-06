import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from '../entities/user.entity';

@Controller('demo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DemoController {
    @Get('free')
    getFreeContent(@CurrentUser() user: User) {
        return {
            message: 'This is accessible to all authenticated users',
            userRole: user.role,
            content: 'Free tier content',
        };
    }

    @Get('premium')
    @Roles(UserRole.PREMIUM, UserRole.ADMIN)
    getPremiumContent(@CurrentUser() user: User) {
        return {
            message: 'This is premium content',
            userRole: user.role,
            content: 'Premium features: Advanced chat, file sharing, custom themes',
        };
    }

    @Get('admin')
    @Roles(UserRole.ADMIN)
    getAdminContent(@CurrentUser() user: User) {
        return {
            message: 'This is admin-only content',
            userRole: user.role,
            content: 'Admin panel: User management, system settings, analytics',
        };
    }
}

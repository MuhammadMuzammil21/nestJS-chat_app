import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UserRole, User } from '../entities/user.entity';

describe('AuthController - Role-Based Access Control', () => {
    let controller: AuthController;
    let authService: AuthService;

    const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
        role: UserRole.FREE,
        subscriptionStatus: 'INACTIVE' as any,
        googleId: 'google123',
        statusMessage: null,
        stripeCustomerId: null,
        isBanned: false,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockPremiumUser: User = {
        ...mockUser,
        id: '2',
        email: 'premium@example.com',
        role: UserRole.PREMIUM,
    };

    const mockAdminUser: User = {
        ...mockUser,
        id: '3',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
    };

    const mockAuthService = {
        login: jest.fn(),
        refreshToken: jest.fn(),
        logout: jest.fn(),
        validateUser: jest.fn(),
        assignRole: jest.fn(),
        getAllUsers: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getPremiumContent', () => {
        it('should allow PREMIUM users to access premium content', async () => {
            const result = await controller.getPremiumContent(mockPremiumUser);

            expect(result).toHaveProperty('message');
            expect(result).toHaveProperty('content');
            expect(result.user.role).toBe(UserRole.PREMIUM);
        });

        it('should allow ADMIN users to access premium content', async () => {
            const result = await controller.getPremiumContent(mockAdminUser);

            expect(result).toHaveProperty('message');
            expect(result.user.role).toBe(UserRole.ADMIN);
        });
    });

    describe('getAllUsers', () => {
        it('should allow ADMIN users to get all users', async () => {
            const mockUsers = [mockUser, mockPremiumUser, mockAdminUser];
            mockAuthService.getAllUsers.mockResolvedValue(mockUsers);

            const result = await controller.getAllUsers(mockAdminUser);

            expect(result).toHaveProperty('users');
            expect(result.users).toHaveLength(3);
            expect(result.admin.role).toBe(UserRole.ADMIN);
            expect(authService.getAllUsers).toHaveBeenCalled();
        });
    });

    describe('assignRole', () => {
        it('should allow ADMIN users to assign roles', async () => {
            const updatedUser = { ...mockUser, role: UserRole.PREMIUM };
            mockAuthService.assignRole.mockResolvedValue(updatedUser);

            const result = await controller.assignRole(mockAdminUser, {
                userId: mockUser.id,
                role: UserRole.PREMIUM,
            });

            expect(result).toHaveProperty('message');
            expect(result.user.role).toBe(UserRole.PREMIUM);
            expect(authService.assignRole).toHaveBeenCalledWith(mockUser.id, UserRole.PREMIUM);
        });
    });
});


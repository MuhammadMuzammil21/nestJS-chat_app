import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User, UserRole, SubscriptionStatus } from '../entities/user.entity';
import { GoogleUserDto } from './dto/auth.dto';

describe('AuthService', () => {
    let service: AuthService;
    let userRepository: Repository<User>;
    let jwtService: JwtService;
    let configService: ConfigService;

    const mockUser: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        googleId: 'google-123',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: UserRole.FREE,
        subscriptionStatus: SubscriptionStatus.INACTIVE,
        statusMessage: null,
        stripeCustomerId: null,
        isBanned: false,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockGoogleUser: GoogleUserDto = {
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        googleId: 'google-123',
    };

    const mockRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        find: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
        verify: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            const config: Record<string, any> = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d',
            };
            return config[key];
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        jwtService = module.get<JwtService>(JwtService);
        configService = module.get<ConfigService>(ConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('validateGoogleUser', () => {
        it('should return existing user when found by Google ID', async () => {
            mockRepository.findOne.mockResolvedValueOnce(mockUser);

            const result = await service.validateGoogleUser(mockGoogleUser);

            expect(result).toEqual(mockUser);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { googleId: mockGoogleUser.googleId },
            });
            expect(mockRepository.save).not.toHaveBeenCalled();
        });

        it('should link Google account to existing user by email', async () => {
            const existingUser = { ...mockUser, googleId: null };
            mockRepository.findOne
                .mockResolvedValueOnce(null) // Not found by Google ID
                .mockResolvedValueOnce(existingUser); // Found by email

            mockRepository.save.mockResolvedValue({
                ...existingUser,
                googleId: mockGoogleUser.googleId,
                displayName: mockGoogleUser.displayName,
                avatarUrl: mockGoogleUser.avatarUrl,
            });

            const result = await service.validateGoogleUser(mockGoogleUser);

            expect(result.googleId).toBe(mockGoogleUser.googleId);
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should create new user when not found', async () => {
            const newUser = { ...mockUser, id: 'new-user-id' };
            mockRepository.findOne
                .mockResolvedValueOnce(null) // Not found by Google ID
                .mockResolvedValueOnce(null); // Not found by email

            mockRepository.create.mockReturnValue(newUser);
            mockRepository.save.mockResolvedValue(newUser);

            const result = await service.validateGoogleUser(mockGoogleUser);

            expect(result).toEqual(newUser);
            expect(mockRepository.create).toHaveBeenCalledWith({
                email: mockGoogleUser.email,
                googleId: mockGoogleUser.googleId,
                displayName: mockGoogleUser.displayName,
                avatarUrl: mockGoogleUser.avatarUrl,
                role: UserRole.FREE,
            });
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should handle null avatarUrl', async () => {
            const googleUserWithoutAvatar = { ...mockGoogleUser, avatarUrl: null };
            mockRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
            mockRepository.create.mockReturnValue(mockUser);
            mockRepository.save.mockResolvedValue(mockUser);

            await service.validateGoogleUser(googleUserWithoutAvatar);

            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    avatarUrl: null,
                }),
            );
        });
    });

    describe('login', () => {
        it('should generate access and refresh tokens', async () => {
            const accessToken = 'access-token';
            const refreshToken = 'refresh-token';

            mockJwtService.sign
                .mockReturnValueOnce(accessToken)
                .mockReturnValueOnce(refreshToken);

            mockRepository.save.mockResolvedValue({
                ...mockUser,
                refreshToken,
            });

            const result = await service.login(mockUser);

            expect(result.accessToken).toBe(accessToken);
            expect(result.refreshToken).toBe(refreshToken);
            expect(result.user.id).toBe(mockUser.id);
            expect(result.user.email).toBe(mockUser.email);
            expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
            expect(mockRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ refreshToken }),
            );
        });

        it('should use correct JWT payload', async () => {
            mockJwtService.sign.mockReturnValue('token');
            mockRepository.save.mockResolvedValue(mockUser);

            await service.login(mockUser);

            expect(mockJwtService.sign).toHaveBeenCalledWith({
                email: mockUser.email,
                sub: mockUser.id,
            });
        });

        it('should use refresh secret for refresh token', async () => {
            mockJwtService.sign.mockReturnValue('token');
            mockRepository.save.mockResolvedValue(mockUser);

            await service.login(mockUser);

            expect(mockJwtService.sign).toHaveBeenCalledWith(
                { email: mockUser.email, sub: mockUser.id },
                expect.objectContaining({
                    secret: 'test-refresh-secret',
                    expiresIn: '7d',
                }),
            );
        });
    });

    describe('refreshToken', () => {
        it('should generate new tokens with valid refresh token', async () => {
            const oldRefreshToken = 'old-refresh-token';
            const newAccessToken = 'new-access-token';
            const newRefreshToken = 'new-refresh-token';
            const userWithToken = { ...mockUser, refreshToken: oldRefreshToken };

            mockJwtService.verify.mockReturnValue({ sub: mockUser.id, email: mockUser.email });
            mockRepository.findOne.mockResolvedValue(userWithToken);
            mockJwtService.sign
                .mockReturnValueOnce(newAccessToken)
                .mockReturnValueOnce(newRefreshToken);
            mockRepository.save.mockResolvedValue({
                ...userWithToken,
                refreshToken: newRefreshToken,
            });

            const result = await service.refreshToken(oldRefreshToken);

            expect(result.accessToken).toBe(newAccessToken);
            expect(result.refreshToken).toBe(newRefreshToken);
            expect(mockRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ refreshToken: newRefreshToken }),
            );
        });

        it('should throw UnauthorizedException for invalid refresh token', async () => {
            mockJwtService.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when user not found', async () => {
            mockJwtService.verify.mockReturnValue({ sub: 'non-existent-id' });
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.refreshToken('valid-token')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when refresh token mismatch', async () => {
            mockJwtService.verify.mockReturnValue({ sub: mockUser.id });
            mockRepository.findOne.mockResolvedValue({
                ...mockUser,
                refreshToken: 'different-token',
            });

            await expect(service.refreshToken('valid-token')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for banned user', async () => {
            const bannedUser = { ...mockUser, isBanned: true, refreshToken: 'valid-token' };
            mockJwtService.verify.mockReturnValue({ sub: mockUser.id });
            mockRepository.findOne.mockResolvedValue(bannedUser);

            await expect(service.refreshToken('valid-token')).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('validateUser', () => {
        it('should return user when found', async () => {
            mockRepository.findOne.mockResolvedValue(mockUser);

            const result = await service.validateUser(mockUser.id);

            expect(result).toEqual(mockUser);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: mockUser.id },
            });
        });

        it('should return null when user not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await service.validateUser('non-existent-id');

            expect(result).toBeNull();
        });
    });

    describe('logout', () => {
        it('should clear refresh token', async () => {
            mockRepository.update.mockResolvedValue({ affected: 1 } as any);

            await service.logout(mockUser.id);

            expect(mockRepository.update).toHaveBeenCalledWith(mockUser.id, {
                refreshToken: null,
            });
        });
    });

    describe('assignRole', () => {
        it('should assign role to user', async () => {
            const updatedUser = { ...mockUser, role: UserRole.PREMIUM };
            mockRepository.findOne.mockResolvedValue(mockUser);
            mockRepository.save.mockResolvedValue(updatedUser);

            const result = await service.assignRole(mockUser.id, UserRole.PREMIUM);

            expect(result.role).toBe(UserRole.PREMIUM);
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException when user not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.assignRole('non-existent-id', UserRole.PREMIUM)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getAllUsers', () => {
        it('should return all users with selected fields', async () => {
            const users = [mockUser];
            mockRepository.find.mockResolvedValue(users);

            const result = await service.getAllUsers();

            expect(result).toEqual(users);
            expect(mockRepository.find).toHaveBeenCalledWith({
                select: [
                    'id',
                    'email',
                    'displayName',
                    'avatarUrl',
                    'role',
                    'subscriptionStatus',
                    'isBanned',
                    'createdAt',
                ],
            });
        });
    });
});

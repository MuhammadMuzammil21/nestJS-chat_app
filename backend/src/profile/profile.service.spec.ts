import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { User, UserRole, SubscriptionStatus } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('ProfileService', () => {
    let service: ProfileService;
    let repository: Repository<User>;

    const mockUser: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        googleId: null,
        displayName: 'Test User',
        avatarUrl: null,
        statusMessage: null,
        role: UserRole.FREE,
        subscriptionStatus: SubscriptionStatus.INACTIVE,
        stripeCustomerId: null,
        isBanned: false,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProfileService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<ProfileService>(ProfileService);
        repository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getProfile', () => {
        it('should return user profile successfully', async () => {
            mockRepository.findOne.mockResolvedValue(mockUser);

            const result = await service.getProfile('test-user-id');

            expect(result).toBeDefined();
            expect(result.id).toBe(mockUser.id);
            expect(result.email).toBe(mockUser.email);
            expect(result.displayName).toBe(mockUser.displayName);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'test-user-id' },
                select: expect.arrayContaining([
                    'id',
                    'email',
                    'displayName',
                    'avatarUrl',
                    'statusMessage',
                    'role',
                    'subscriptionStatus',
                    'createdAt',
                    'updatedAt',
                ]),
            });
        });

        it('should throw NotFoundException when user does not exist', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.getProfile('non-existent-id')).rejects.toThrow(NotFoundException);
        });

        it('should throw InternalServerErrorException on database error', async () => {
            mockRepository.findOne.mockRejectedValue(new Error('Database error'));

            await expect(service.getProfile('test-user-id')).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('updateProfile', () => {
        it('should update profile successfully with valid data', async () => {
            const updateDto: UpdateProfileDto = {
                displayName: 'Updated Name',
                statusMessage: 'New status',
            };

            const updatedUser = { ...mockUser, ...updateDto };
            mockRepository.findOne.mockResolvedValue(mockUser);
            mockRepository.save.mockResolvedValue(updatedUser);

            const result = await service.updateProfile('test-user-id', updateDto);

            expect(result.displayName).toBe('Updated Name');
            expect(result.statusMessage).toBe('New status');
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should update only provided fields', async () => {
            const updateDto: UpdateProfileDto = {
                displayName: 'Updated Name',
            };

            const updatedUser = { ...mockUser, displayName: 'Updated Name' };
            mockRepository.findOne.mockResolvedValue(mockUser);
            mockRepository.save.mockResolvedValue(updatedUser);

            const result = await service.updateProfile('test-user-id', updateDto);

            expect(result.displayName).toBe('Updated Name');
            expect(result.statusMessage).toBe(mockUser.statusMessage);
        });

        it('should throw NotFoundException when user does not exist', async () => {
            const updateDto: UpdateProfileDto = {
                displayName: 'Updated Name',
            };

            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.updateProfile('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException for invalid display name length', async () => {
            const updateDto: UpdateProfileDto = {
                displayName: 'A', // Too short
            };

            mockRepository.findOne.mockResolvedValue(mockUser);

            await expect(service.updateProfile('test-user-id', updateDto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException for display name exceeding max length', async () => {
            const updateDto: UpdateProfileDto = {
                displayName: 'A'.repeat(51), // Too long
            };

            mockRepository.findOne.mockResolvedValue(mockUser);

            await expect(service.updateProfile('test-user-id', updateDto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException for status message exceeding max length', async () => {
            const updateDto: UpdateProfileDto = {
                statusMessage: 'A'.repeat(201), // Too long
            };

            mockRepository.findOne.mockResolvedValue(mockUser);

            await expect(service.updateProfile('test-user-id', updateDto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException for invalid avatar URL', async () => {
            const updateDto: UpdateProfileDto = {
                avatarUrl: 'not-a-valid-url',
            };

            mockRepository.findOne.mockResolvedValue(mockUser);

            await expect(service.updateProfile('test-user-id', updateDto)).rejects.toThrow(BadRequestException);
        });

        it('should accept valid avatar URL', async () => {
            const updateDto: UpdateProfileDto = {
                avatarUrl: 'https://example.com/avatar.jpg',
            };

            const updatedUser = { ...mockUser, avatarUrl: 'https://example.com/avatar.jpg' };
            mockRepository.findOne.mockResolvedValue(mockUser);
            mockRepository.save.mockResolvedValue(updatedUser);

            const result = await service.updateProfile('test-user-id', updateDto);

            expect(result.avatarUrl).toBe('https://example.com/avatar.jpg');
        });

        it('should allow null avatar URL', async () => {
            const updateDto: UpdateProfileDto = {
                avatarUrl: null,
            };

            const updatedUser = { ...mockUser, avatarUrl: null };
            mockRepository.findOne.mockResolvedValue(mockUser);
            mockRepository.save.mockResolvedValue(updatedUser);

            const result = await service.updateProfile('test-user-id', updateDto);

            expect(result.avatarUrl).toBeNull();
        });

        it('should throw InternalServerErrorException on database error', async () => {
            const updateDto: UpdateProfileDto = {
                displayName: 'Updated Name',
            };

            mockRepository.findOne.mockResolvedValue(mockUser);
            mockRepository.save.mockRejectedValue(new Error('Database error'));

            await expect(service.updateProfile('test-user-id', updateDto)).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('updateAvatarUrl', () => {
        it('should update avatar URL successfully', async () => {
            const avatarUrl = 'https://example.com/avatar.jpg';
            const updatedUser = { ...mockUser, avatarUrl };

            mockRepository.findOne.mockResolvedValue(mockUser);
            mockRepository.save.mockResolvedValue(updatedUser);

            const result = await service.updateAvatarUrl('test-user-id', avatarUrl);

            expect(result.avatarUrl).toBe(avatarUrl);
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException when user does not exist', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.updateAvatarUrl('non-existent-id', 'https://example.com/avatar.jpg')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw BadRequestException for invalid URL', async () => {
            mockRepository.findOne.mockResolvedValue(mockUser);

            await expect(service.updateAvatarUrl('test-user-id', 'not-a-valid-url')).rejects.toThrow(BadRequestException);
        });

        it('should throw InternalServerErrorException on database error', async () => {
            mockRepository.findOne.mockResolvedValue(mockUser);
            mockRepository.save.mockRejectedValue(new Error('Database error'));

            await expect(service.updateAvatarUrl('test-user-id', 'https://example.com/avatar.jpg')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });
});

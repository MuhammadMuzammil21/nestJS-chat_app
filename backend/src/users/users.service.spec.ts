import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole, SubscriptionStatus } from '../entities/user.entity';

describe('UsersService', () => {
    let service: UsersService;
    let repository: Repository<User>;

    const mockUser: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        googleId: null,
        displayName: 'Test User',
        avatarUrl: null,
        role: UserRole.FREE,
        subscriptionStatus: SubscriptionStatus.INACTIVE,
        statusMessage: null,
        stripeCustomerId: null,
        isBanned: false,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all users with selected fields', async () => {
            const users = [mockUser];
            mockRepository.find.mockResolvedValue(users);

            const result = await service.findAll();

            expect(result).toEqual(users);
            expect(mockRepository.find).toHaveBeenCalledWith({
                select: ['id', 'email', 'displayName', 'avatarUrl', 'role', 'subscriptionStatus', 'createdAt'],
            });
        });

        it('should return empty array when no users exist', async () => {
            mockRepository.find.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('findOne', () => {
        it('should return user when found', async () => {
            mockRepository.findOne.mockResolvedValue(mockUser);

            const result = await service.findOne(mockUser.id);

            expect(result).toEqual(mockUser);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                select: [
                    'id',
                    'email',
                    'displayName',
                    'avatarUrl',
                    'role',
                    'subscriptionStatus',
                    'isBanned',
                    'createdAt',
                    'updatedAt',
                ],
            });
        });

        it('should return null when user not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await service.findOne('non-existent-id');

            expect(result).toBeNull();
        });
    });

    describe('updateRole', () => {
        it('should update user role successfully', async () => {
            const updatedUser = { ...mockUser, role: UserRole.PREMIUM };
            mockRepository.findOne.mockResolvedValue(mockUser);
            mockRepository.save.mockResolvedValue(updatedUser);

            const result = await service.updateRole(mockUser.id, UserRole.PREMIUM);

            expect(result.role).toBe(UserRole.PREMIUM);
            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
            expect(mockRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ role: UserRole.PREMIUM }),
            );
        });

        it('should throw NotFoundException when user not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.updateRole('non-existent-id', UserRole.PREMIUM)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should update role to ADMIN', async () => {
            const updatedUser = { ...mockUser, role: UserRole.ADMIN };
            mockRepository.findOne.mockResolvedValue(mockUser);
            mockRepository.save.mockResolvedValue(updatedUser);

            const result = await service.updateRole(mockUser.id, UserRole.ADMIN);

            expect(result.role).toBe(UserRole.ADMIN);
        });
    });
});

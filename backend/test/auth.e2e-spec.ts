import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { User, UserRole, SubscriptionStatus } from '../src/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('Auth Flow (e2e)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;
    let jwtService: JwtService;
    let configService: ConfigService;

    const testUser: Partial<User> = {
        email: 'test@example.com',
        displayName: 'Test User',
        googleId: 'google-123',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: UserRole.FREE,
        subscriptionStatus: SubscriptionStatus.INACTIVE,
        isBanned: false,
        refreshToken: null,
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
        jwtService = moduleFixture.get<JwtService>(JwtService);
        configService = moduleFixture.get<ConfigService>(ConfigService);

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        // Clean up test data
        await userRepository.delete({ email: testUser.email });
    });

    describe('POST /auth/refresh', () => {
        it('should refresh token successfully', async () => {
            // Create a user with a refresh token
            const user = await userRepository.save({
                ...testUser,
                refreshToken: 'test-refresh-token',
            } as User);

            const refreshToken = jwtService.sign(
                { email: user.email, sub: user.id },
                {
                    secret: configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret-key',
                    expiresIn: configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
                },
            );

            // Update user with valid refresh token
            await userRepository.update(user.id, { refreshToken });

            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({ refreshToken })
                .expect(200);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body.accessToken).toBeDefined();
            expect(response.body.refreshToken).toBeDefined();
        });

        it('should return 401 for invalid refresh token', async () => {
            await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({ refreshToken: 'invalid-token' })
                .expect(401);
        });

        it('should return 400 for missing refresh token', async () => {
            await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({})
                .expect(400);
        });
    });

    describe('GET /auth/profile', () => {
        it('should return user profile with valid JWT', async () => {
            const user = await userRepository.save(testUser as User);

            const accessToken = jwtService.sign({ email: user.email, sub: user.id });

            const response = await request(app.getHttpServer())
                .get('/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id', user.id);
            expect(response.body).toHaveProperty('email', user.email);
            expect(response.body).toHaveProperty('displayName', user.displayName);
        });

        it('should return 401 without token', async () => {
            await request(app.getHttpServer()).get('/auth/profile').expect(401);
        });

        it('should return 401 with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return 401 for banned user', async () => {
            const bannedUser = await userRepository.save({
                ...testUser,
                isBanned: true,
            } as User);

            const accessToken = jwtService.sign({ email: bannedUser.email, sub: bannedUser.id });

            await request(app.getHttpServer())
                .get('/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(401);
        });
    });

    describe('POST /auth/logout', () => {
        it('should logout successfully', async () => {
            const user = await userRepository.save({
                ...testUser,
                refreshToken: 'some-refresh-token',
            } as User);

            const accessToken = jwtService.sign({ email: user.email, sub: user.id });

            await request(app.getHttpServer())
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            // Verify refresh token was cleared
            const updatedUser = await userRepository.findOne({ where: { id: user.id } });
            expect(updatedUser?.refreshToken).toBeNull();
        });
    });

    describe('Role-Based Authorization', () => {
        it('should allow PREMIUM user to access premium content', async () => {
            const premiumUser = await userRepository.save({
                ...testUser,
                email: 'premium@example.com',
                role: UserRole.PREMIUM,
            } as User);

            const accessToken = jwtService.sign({ email: premiumUser.email, sub: premiumUser.id });

            const response = await request(app.getHttpServer())
                .get('/auth/premium/content')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.user.role).toBe(UserRole.PREMIUM);
        });

        it('should allow ADMIN user to access premium content', async () => {
            const adminUser = await userRepository.save({
                ...testUser,
                email: 'admin@example.com',
                role: UserRole.ADMIN,
            } as User);

            const accessToken = jwtService.sign({ email: adminUser.email, sub: adminUser.id });

            await request(app.getHttpServer())
                .get('/auth/premium/content')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
        });

        it('should deny FREE user access to premium content', async () => {
            const freeUser = await userRepository.save({
                ...testUser,
                email: 'free@example.com',
                role: UserRole.FREE,
            } as User);

            const accessToken = jwtService.sign({ email: freeUser.email, sub: freeUser.id });

            await request(app.getHttpServer())
                .get('/auth/premium/content')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(403);
        });

        it('should allow ADMIN to assign roles', async () => {
            const adminUser = await userRepository.save({
                ...testUser,
                email: 'admin2@example.com',
                role: UserRole.ADMIN,
            } as User);

            const targetUser = await userRepository.save({
                ...testUser,
                email: 'target@example.com',
                role: UserRole.FREE,
            } as User);

            const accessToken = jwtService.sign({ email: adminUser.email, sub: adminUser.id });

            const response = await request(app.getHttpServer())
                .post('/auth/admin/assign-role')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ userId: targetUser.id, role: UserRole.PREMIUM })
                .expect(200);

            expect(response.body.user.role).toBe(UserRole.PREMIUM);
        });

        it('should deny non-ADMIN users from assigning roles', async () => {
            const premiumUser = await userRepository.save({
                ...testUser,
                email: 'premium2@example.com',
                role: UserRole.PREMIUM,
            } as User);

            const targetUser = await userRepository.save({
                ...testUser,
                email: 'target2@example.com',
                role: UserRole.FREE,
            } as User);

            const accessToken = jwtService.sign({ email: premiumUser.email, sub: premiumUser.id });

            await request(app.getHttpServer())
                .post('/auth/admin/assign-role')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ userId: targetUser.id, role: UserRole.PREMIUM })
                .expect(403);
        });

        it('should allow ADMIN to get all users', async () => {
            const adminUser = await userRepository.save({
                ...testUser,
                email: 'admin3@example.com',
                role: UserRole.ADMIN,
            } as User);

            const accessToken = jwtService.sign({ email: adminUser.email, sub: adminUser.id });

            const response = await request(app.getHttpServer())
                .get('/auth/admin/users')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('users');
            expect(response.body).toHaveProperty('count');
        });
    });
});

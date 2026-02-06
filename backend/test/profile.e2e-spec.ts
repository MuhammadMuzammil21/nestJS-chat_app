import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { User, UserRole, SubscriptionStatus } from '../src/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

describe('Profile Management (e2e)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;
    let jwtService: JwtService;

    const testUser: Partial<User> = {
        email: 'profile@example.com',
        displayName: 'Profile Test User',
        googleId: 'google-profile-123',
        avatarUrl: null,
        role: UserRole.FREE,
        subscriptionStatus: SubscriptionStatus.INACTIVE,
        statusMessage: null,
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

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        await userRepository.delete({ email: testUser.email });
    });

    describe('GET /profile', () => {
        it('should return user profile', async () => {
            const user = await userRepository.save(testUser as User);
            const accessToken = jwtService.sign({ email: user.email, sub: user.id });

            const response = await request(app.getHttpServer())
                .get('/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id', user.id);
            expect(response.body).toHaveProperty('email', user.email);
            expect(response.body).toHaveProperty('displayName', user.displayName);
            expect(response.body).toHaveProperty('role', user.role);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer()).get('/profile').expect(401);
        });
    });

    describe('PUT /profile', () => {
        it('should update profile successfully', async () => {
            const user = await userRepository.save(testUser as User);
            const accessToken = jwtService.sign({ email: user.email, sub: user.id });

            const updateData = {
                displayName: 'Updated Name',
                statusMessage: 'New status message',
            };

            const response = await request(app.getHttpServer())
                .put('/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.displayName).toBe(updateData.displayName);
            expect(response.body.statusMessage).toBe(updateData.statusMessage);
        });

        it('should update avatar URL', async () => {
            const user = await userRepository.save(testUser as User);
            const accessToken = jwtService.sign({ email: user.email, sub: user.id });

            const updateData = {
                avatarUrl: 'https://example.com/new-avatar.jpg',
            };

            const response = await request(app.getHttpServer())
                .put('/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.avatarUrl).toBe(updateData.avatarUrl);
        });

        it('should validate display name length', async () => {
            const user = await userRepository.save(testUser as User);
            const accessToken = jwtService.sign({ email: user.email, sub: user.id });

            await request(app.getHttpServer())
                .put('/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ displayName: 'A' }) // Too short
                .expect(400);

            await request(app.getHttpServer())
                .put('/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ displayName: 'A'.repeat(51) }) // Too long
                .expect(400);
        });

        it('should validate status message length', async () => {
            const user = await userRepository.save(testUser as User);
            const accessToken = jwtService.sign({ email: user.email, sub: user.id });

            await request(app.getHttpServer())
                .put('/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ statusMessage: 'A'.repeat(201) }) // Too long
                .expect(400);
        });

        it('should validate avatar URL format', async () => {
            const user = await userRepository.save(testUser as User);
            const accessToken = jwtService.sign({ email: user.email, sub: user.id });

            await request(app.getHttpServer())
                .put('/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ avatarUrl: 'not-a-valid-url' })
                .expect(400);
        });

        it('should allow partial updates', async () => {
            const user = await userRepository.save(testUser as User);
            const accessToken = jwtService.sign({ email: user.email, sub: user.id });

            const response = await request(app.getHttpServer())
                .put('/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ displayName: 'Partial Update' })
                .expect(200);

            expect(response.body.displayName).toBe('Partial Update');
            // Other fields should remain unchanged
            expect(response.body.email).toBe(user.email);
        });
    });

    describe('POST /profile/avatar', () => {
        it('should upload avatar file successfully', async () => {
            const user = await userRepository.save(testUser as User);
            const accessToken = jwtService.sign({ email: user.email, sub: user.id });

            // Create a mock image file buffer
            const imageBuffer = Buffer.from('fake-image-data');

            const response = await request(app.getHttpServer())
                .post('/profile/avatar')
                .set('Authorization', `Bearer ${accessToken}`)
                .attach('file', imageBuffer, 'avatar.jpg')
                .expect(200);

            expect(response.body).toHaveProperty('avatarUrl');
            expect(response.body.avatarUrl).toContain('/uploads/avatars/');
        });

        it('should reject non-image files', async () => {
            const user = await userRepository.save(testUser as User);
            const accessToken = jwtService.sign({ email: user.email, sub: user.id });

            const textBuffer = Buffer.from('not an image');

            await request(app.getHttpServer())
                .post('/profile/avatar')
                .set('Authorization', `Bearer ${accessToken}`)
                .attach('file', textBuffer, 'document.txt')
                .expect(400);
        });

        it('should require authentication', async () => {
            await request(app.getHttpServer()).post('/profile/avatar').expect(401);
        });
    });
});

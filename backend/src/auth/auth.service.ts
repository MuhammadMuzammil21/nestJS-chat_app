import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../entities/user.entity';
import { GoogleUserDto, TokenResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async validateGoogleUser(googleUser: GoogleUserDto): Promise<User> {
        // Check if user exists by Google ID
        let user = await this.userRepository.findOne({
            where: { googleId: googleUser.googleId },
        });

        if (!user) {
            // Check if user exists by email
            user = await this.userRepository.findOne({
                where: { email: googleUser.email },
            });

            if (user) {
                // Link Google account to existing user
                user.googleId = googleUser.googleId;
                user.displayName = googleUser.displayName;
                user.avatarUrl = googleUser.avatarUrl || null;
                await this.userRepository.save(user);
            } else {
                // Create new user with default FREE role
                user = this.userRepository.create({
                    email: googleUser.email,
                    googleId: googleUser.googleId,
                    displayName: googleUser.displayName,
                    avatarUrl: googleUser.avatarUrl || null,
                    role: UserRole.FREE, // Explicitly set default role
                });
                await this.userRepository.save(user);
            }
        }

        return user;
    }

    async login(user: User): Promise<TokenResponseDto> {
        const payload = { email: user.email, sub: user.id };

        const accessToken = this.jwtService.sign(payload);

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret-key',
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        });

        // Store refresh token in database
        user.refreshToken = refreshToken;
        await this.userRepository.save(user);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl || undefined,
                role: user.role,
            },
        };
    }

    async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret-key',
            });

            const user = await this.userRepository.findOne({
                where: { id: payload.sub },
            });

            if (!user || user.refreshToken !== refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            if (user.isBanned) {
                throw new UnauthorizedException('User is banned');
            }

            // Generate new access token
            const newAccessToken = this.jwtService.sign({
                email: user.email,
                sub: user.id,
            });

            // Generate new refresh token (token rotation)
            const newRefreshToken = this.jwtService.sign(
                { email: user.email, sub: user.id },
                {
                    secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret-key',
                    expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
                }
            );

            // Update refresh token in database (invalidate old token)
            user.refreshToken = newRefreshToken;
            await this.userRepository.save(user);

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async validateUser(userId: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { id: userId } });
    }

    async logout(userId: string): Promise<void> {
        await this.userRepository.update(userId, { refreshToken: null });
    }

    async assignRole(userId: string, role: UserRole): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        user.role = role;
        return await this.userRepository.save(user);
    }

    async getAllUsers(): Promise<User[]> {
        return this.userRepository.find({
            select: ['id', 'email', 'displayName', 'avatarUrl', 'role', 'subscriptionStatus', 'isBanned', 'createdAt'],
        });
    }
}

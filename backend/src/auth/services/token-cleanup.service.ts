import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../entities/user.entity';

@Injectable()
export class TokenCleanupService {
    private readonly logger = new Logger(TokenCleanupService.name);

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    /**
     * Runs daily at 2:00 AM to clean up expired refresh tokens
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async cleanupExpiredTokens() {
        this.logger.log('Starting expired token cleanup...');

        try {
            // Get all users with refresh tokens
            const usersWithTokens = await this.userRepository.find({
                where: {
                    refreshToken: Not(IsNull()),
                },
            });

            let expiredCount = 0;
            const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret-key';

            for (const user of usersWithTokens) {
                if (!user.refreshToken) {
                    continue;
                }

                try {
                    // Try to verify the token
                    this.jwtService.verify(user.refreshToken, {
                        secret: refreshSecret,
                    });
                } catch (error) {
                    // Token is expired or invalid, remove it
                    user.refreshToken = null;
                    await this.userRepository.save(user);
                    expiredCount++;
                    this.logger.debug(`Removed expired token for user: ${user.email}`);
                }
            }

            this.logger.log(`Token cleanup completed. Removed ${expiredCount} expired tokens out of ${usersWithTokens.length} total tokens.`);
        } catch (error) {
            this.logger.error('Error during token cleanup:', error);
        }
    }

    /**
     * Manual cleanup method that can be called on-demand
     */
    async manualCleanup(): Promise<{ removed: number; total: number }> {
        this.logger.log('Starting manual token cleanup...');

        const usersWithTokens = await this.userRepository.find({
            where: {
                refreshToken: Not(IsNull()),
            },
        });

        let expiredCount = 0;
        const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret-key';

        for (const user of usersWithTokens) {
            if (!user.refreshToken) {
                continue;
            }

            try {
                this.jwtService.verify(user.refreshToken, {
                    secret: refreshSecret,
                });
            } catch (error) {
                user.refreshToken = null;
                await this.userRepository.save(user);
                expiredCount++;
            }
        }

        this.logger.log(`Manual cleanup completed. Removed ${expiredCount} expired tokens.`);

        return {
            removed: expiredCount,
            total: usersWithTokens.length,
        };
    }
}

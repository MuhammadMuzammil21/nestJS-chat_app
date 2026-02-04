import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from '../entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenCleanupService } from './services/token-cleanup.service';


@Module({
    imports: [
        ScheduleModule.forRoot(),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRES_IN') || '15m',
                },
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([User]),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        TokenCleanupService,
        // Conditionally provide GoogleStrategy only if credentials exist
        {
            provide: GoogleStrategy,
            useFactory: (configService: ConfigService, authService: AuthService) => {
                const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
                const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');

                // Only instantiate GoogleStrategy if credentials are provided
                if (clientId && clientSecret) {
                    return new GoogleStrategy(configService, authService);
                }
                return null;
            },
            inject: [ConfigService, AuthService],
        },
    ],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }

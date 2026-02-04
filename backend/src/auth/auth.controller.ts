import {
    Controller,
    Get,
    Post,
    UseGuards,
    Req,
    Res,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth() {
        // Initiates Google OAuth flow
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleAuthCallback(@Req() req, @Res() res: Response) {
        const tokenResponse = await this.authService.login(req.user);

        // Redirect to frontend with tokens
        const frontendUrl = `http://localhost:5173/auth/callback`;
        const params = new URLSearchParams({
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
            user: JSON.stringify(tokenResponse.user),
        });

        return res.redirect(`${frontendUrl}?${params.toString()}`);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Req() req) {
        return {
            id: req.user.id,
            email: req.user.email,
            displayName: req.user.displayName,
            avatarUrl: req.user.avatarUrl,
            role: req.user.role,
            subscriptionStatus: req.user.subscriptionStatus,
        };
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req) {
        await this.authService.logout(req.user.id);
        return { message: 'Logged out successfully' };
    }
}

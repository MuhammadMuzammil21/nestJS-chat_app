import {
    Controller,
    Get,
    Put,
    Post,
    UseGuards,
    Body,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

@ApiTags('profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Get()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: ProfileResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@CurrentUser() user: User): Promise<ProfileResponseDto> {
        return this.profileService.getProfile(user.id);
    }

    @Put()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update user profile' })
    @ApiBody({ type: UpdateProfileDto })
    @ApiResponse({ status: 200, description: 'Profile updated successfully', type: ProfileResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async updateProfile(
        @CurrentUser() user: User,
        @Body() updateProfileDto: UpdateProfileDto,
    ): Promise<ProfileResponseDto> {
        return this.profileService.updateProfile(user.id, updateProfileDto);
    }

    @Post('avatar')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Upload profile avatar' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file (JPEG, PNG, GIF, WebP, max 5MB)',
                },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Avatar uploaded successfully', type: ProfileResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid file type or size' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: join(process.cwd(), 'uploads', 'avatars'),
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    cb(null, `avatar-${uniqueSuffix}${ext}`);
                },
            }),
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB limit
            },
            fileFilter: (req, file, cb) => {
                const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                if (allowedMimes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new BadRequestException('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
                }
            },
        }),
    )
    async uploadAvatar(
        @CurrentUser() user: User,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<ProfileResponseDto> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Construct the URL for the uploaded file
        // In production, you would use a CDN or cloud storage URL
        const avatarUrl = `/uploads/avatars/${file.filename}`;

        return this.profileService.updateAvatarUrl(user.id, avatarUrl);
    }
}

import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    async getProfile(userId: string): Promise<ProfileResponseDto> {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId },
                select: [
                    'id',
                    'email',
                    'displayName',
                    'avatarUrl',
                    'statusMessage',
                    'role',
                    'subscriptionStatus',
                    'createdAt',
                    'updatedAt',
                ],
            });

            if (!user) {
                throw new NotFoundException(`User with ID ${userId} not found`);
            }

            return new ProfileResponseDto(user);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to retrieve profile');
        }
    }

    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<ProfileResponseDto> {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId },
            });

            if (!user) {
                throw new NotFoundException(`User with ID ${userId} not found`);
            }

            // Validate display name if provided
            if (updateProfileDto.displayName !== undefined) {
                if (updateProfileDto.displayName.length < 2 || updateProfileDto.displayName.length > 50) {
                    throw new BadRequestException('Display name must be between 2 and 50 characters');
                }
            }

            // Validate status message if provided
            if (updateProfileDto.statusMessage !== undefined) {
                if (updateProfileDto.statusMessage.length > 200) {
                    throw new BadRequestException('Status message must not exceed 200 characters');
                }
            }

            // Validate avatar URL if provided
            if (updateProfileDto.avatarUrl !== undefined && updateProfileDto.avatarUrl !== null) {
                try {
                    new URL(updateProfileDto.avatarUrl);
                } catch {
                    throw new BadRequestException('Avatar URL must be a valid URL');
                }
            }

            // Update only provided fields
            if (updateProfileDto.displayName !== undefined) {
                user.displayName = updateProfileDto.displayName;
            }
            if (updateProfileDto.avatarUrl !== undefined) {
                user.avatarUrl = updateProfileDto.avatarUrl || null;
            }
            if (updateProfileDto.statusMessage !== undefined) {
                user.statusMessage = updateProfileDto.statusMessage || null;
            }

            const updatedUser = await this.userRepository.save(user);

            return new ProfileResponseDto(updatedUser);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update profile');
        }
    }

    async updateAvatarUrl(userId: string, avatarUrl: string): Promise<ProfileResponseDto> {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId },
            });

            if (!user) {
                throw new NotFoundException(`User with ID ${userId} not found`);
            }

            // Validate URL
            try {
                new URL(avatarUrl);
            } catch {
                throw new BadRequestException('Avatar URL must be a valid URL');
            }

            user.avatarUrl = avatarUrl;
            const updatedUser = await this.userRepository.save(user);

            return new ProfileResponseDto(updatedUser);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update avatar URL');
        }
    }
}

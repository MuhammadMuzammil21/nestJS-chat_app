import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../entities/user.entity';

export class UpdateRoleDto {
    @ApiProperty({ description: 'User role', enum: UserRole, example: UserRole.PREMIUM })
    @IsEnum(UserRole)
    role: UserRole;
}

import { Controller, Get, Patch, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { UsersService } from './users.service';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @ApiOperation({ summary: 'Get all users (ADMIN only)' })
    @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID (ADMIN only)' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'User retrieved successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async findOne(@Param('id') id: string) {
        const user = await this.usersService.findOne(id);

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    @Patch(':id/role')
    @ApiOperation({ summary: 'Update user role (ADMIN only)' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'Role updated successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
        const user = await this.usersService.updateRole(id, updateRoleDto.role);
        return {
            message: 'User role updated successfully',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }
}

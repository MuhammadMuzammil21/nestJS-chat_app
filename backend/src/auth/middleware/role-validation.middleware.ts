import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../entities/user.entity';

@Injectable()
export class RoleValidationMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Only validate if user is authenticated
        if (req.user) {
            const user = req.user as any;
            
            // Validate that user role is a valid enum value
            const validRoles = Object.values(UserRole);
            if (!validRoles.includes(user.role)) {
                throw new ForbiddenException(`Invalid user role: ${user.role}`);
            }

            // Ensure role is set (default to FREE if somehow missing)
            if (!user.role) {
                user.role = UserRole.FREE;
            }
        }

        next();
    }
}

